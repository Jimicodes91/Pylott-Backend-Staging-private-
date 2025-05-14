import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import { ProjectModelType, MilestonesModelType } from '@/models';
import { createMilestoneDueEmail, createMilestoneTransitionEmail, createProjectDueEmail } from '@/shared/utils/email';
import sendEmail from '@/shared/utils/nodemailer';
import { app } from '@/config/env';

@injectable()
export class NotificationService {
  private readonly traceId = '[NOTIFICATION SERVICE]';

  public async sendMilestoneTransition(project: ProjectModelType, fromMilestone: MilestonesModelType, toMilestone: MilestonesModelType): Promise<void> {
    const emailContent = createMilestoneTransitionEmail(project.name, fromMilestone.name, toMilestone.name, this.calculateOverdueDuration(project.milestone_start_date, fromMilestone.duration));

    try {
      const teamEmails = project?.members?.map((member) => member?.user?.email);
      const subject = `Project ${project.name} moved to ${toMilestone.name}`;
      await sendEmail(teamEmails, subject, emailContent);
    } catch (error) {
      console.error(`${this.traceId} Failed to send milestone email: ${error.message}`);
    }
  }

  public async sendProjectDueNotification(project: ProjectModelType, totalDurationDays: number): Promise<void> {
    const emailContent = createProjectDueEmail(project.name, totalDurationDays, this.calculateOverdueDuration(project.created_at, totalDurationDays));

    try {
      const teamEmails = project?.members?.map((member) => member?.user?.email);
      const subject = `URGENT: Project ${project.name} has exceeded timeline`;
      await sendEmail(teamEmails, subject, emailContent);
    } catch (error) {
      console.error(`${this.traceId} Failed to send project due email: ${error.message}`);
    }
  }

  public async sendMilestoneDueNotification(project: ProjectModelType, milestone: MilestonesModelType, overdueDuration: string): Promise<void> {
    // @Todo use frontend url
    const url = `${app.url}/api/v1/projects/${project.id}`;
    const emailContent = createMilestoneDueEmail(project.name, milestone.name, overdueDuration, milestone.duration, url);

    try {
      const recipients = project?.members?.map((member) => member?.user?.email);
      if (recipients.length === 0) {
        console.warn(`No recipients found for project ${project.id}`);
        return;
      }

      const subject = `URGENT: Milestone Overdue - ${milestone.name} (${project.name})`;
      await sendEmail(recipients, subject, emailContent);
    } catch (error) {
      console.error(`${this.traceId} Failed to send milestone due notification: ${error.message}`);
    }
  }

  private calculateOverdueDuration(startDate: string | Date | null, durationDays: number | string | null): string {
    if (!startDate || !durationDays) return 'N/A';

    const numericDuration = typeof durationDays === 'string' ? parseInt(durationDays) : durationDays;
    if (isNaN(numericDuration)) return 'N/A';

    const dueDate = dayjs(startDate).add(numericDuration, 'day');
    const now = dayjs();

    if (now.isBefore(dueDate)) return '0 days';

    const duration = dayjs.duration(now.diff(dueDate));
    const days = duration.days();
    const hours = duration.hours();

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}
