import { injectable } from 'tsyringe';
import cron from 'node-cron';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import { ProjectRepository, MilestonesRepository } from '@/repositories';

import { ProjectModelType, MilestonesModelType } from '@/models';
import { ProjectStatus } from '@/shared/enums';
import { NotificationService } from './project_notification.service';

dayjs.extend(duration);
dayjs.extend(relativeTime);

@injectable()
export class MilestoneTrackerService {
  private readonly traceId = '[MilestoneTracker]';
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly milestonesRepository: MilestonesRepository,
    private readonly notificationService: NotificationService,
  ) {}

  public async scheduleGlobalChecks(): Promise<void> {
    cron.schedule(
      '0 0 * * *',
      async () => {
        console.log(`${this.traceId} Executing global daily check via node-cron`);
        await this.processGlobalCheck();
      },
      {
        timezone: 'UTC',
      },
    );
    console.log(`${this.traceId} Scheduled global daily checks using node-cron`);
  }

  private async processGlobalCheck(): Promise<void> {
    try {
      const projects = await this.projectRepository.getInProgressProjectsAndEntities();

      console.log(`${this.traceId} Found ${projects.length} projects for global check`);

      for (let i = 0; i < projects.length; i += this.BATCH_SIZE) {
        const batch = projects.slice(i, i + this.BATCH_SIZE);
        await Promise.all(batch.map((project) => this.processProjectMilestones(project)));
      }
    } catch (error: any) {
      console.error(`${this.traceId} Global check failed: ${error.message}`);
      throw error;
    }
  }

  private async processProjectMilestones(project: ProjectModelType): Promise<void> {
    if (!project.milestone_id || !project.project_type_id) {
      console.warn(`${this.traceId} Project ${project.id} missing required data`);
      return;
    }

    try {
      const [currentMilestone, allMilestones] = await Promise.all([
        this.milestonesRepository.findOne({
          id: project.milestone_id,
          company_id: project.company_id,
          deleted_at: null,
        }),
        this.milestonesRepository.findMany({
          project_type_id: project.project_type_id,
          company_id: project.company_id,
          deleted_at: null,
        }),
      ]);

      if (!currentMilestone || !allMilestones?.length) {
        console.warn(`${this.traceId} Missing milestone data for project ${project.id}`);
        return;
      }

      console.log(`${this.traceId} Processing project ${project.id} with current milestone ===> ${JSON.stringify({ currentMilestone, allMilestones })}`);

      await this.checkCurrentMilestone(project, currentMilestone, allMilestones);
      await this.checkTotalProjectDuration(project, allMilestones);
    } catch (error: any) {
      console.error(`${this.traceId} Failed processing project ${project.id}: ${error.message}`);
    }
  }

  private async checkCurrentMilestone(project: ProjectModelType, currentMilestone: MilestonesModelType, allMilestones: MilestonesModelType[]): Promise<void> {
    if (!project.milestone_start_date || !currentMilestone.duration) return;

    const durationDays = Number(currentMilestone.duration);

    if (isNaN(durationDays) || durationDays <= 0) return;

    const endDate = dayjs(project.milestone_start_date).add(durationDays, 'day');
    const isOverdue = dayjs().isAfter(endDate);

    if (isOverdue) {
      const isFinal = allMilestones[allMilestones.length - 1].id === currentMilestone.id;

      if (isFinal) {
        await this.handleFinalMilestoneOverdue(project);
      } else {
        await this.handleIntermediateMilestoneOverdue(project, currentMilestone);
      }
    }
  }

  private async checkTotalProjectDuration(project: ProjectModelType, allMilestones: MilestonesModelType[]): Promise<void> {
    if (!project.created_at) return;

    const totalDurationDays = allMilestones.reduce((sum, m) => {
      const duration = Number(m.duration);
      return sum + (isNaN(duration) ? 0 : duration);
    }, 0);

    if (totalDurationDays <= 0) return;

    const projectEndDate = dayjs(project.created_at).add(totalDurationDays, 'day');
    const isProjectOverdue = dayjs().isAfter(projectEndDate);

    if (isProjectOverdue) {
      const isInFinalMilestone = allMilestones[allMilestones.length - 1].id === project.milestone_id;
      if (!isInFinalMilestone) {
        await this.handleProjectDurationExceeded(project, totalDurationDays);
      }
    }
  }

  private async handleIntermediateMilestoneOverdue(project: ProjectModelType, currentMilestone: MilestonesModelType): Promise<void> {
    try {
      await this.projectRepository.update(
        { id: project.id },
        {
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          milestone_status: ProjectStatus.DUE,
        },
      );

      const durationDays = Number(currentMilestone.duration);
      const endDate = dayjs(project.milestone_start_date).add(durationDays, 'day');
      const overDueDuration = dayjs.duration(dayjs().diff(endDate)).humanize();

      this.notificationService.sendMilestoneDueNotification(project, currentMilestone, overDueDuration);
    } catch (error: any) {
      console.error(`${this.traceId} Failed to update project ${project.id}: ${error.message}`);
      throw error;
    }
  }

  private async handleFinalMilestoneOverdue(project: ProjectModelType): Promise<void> {
    try {
      await this.projectRepository.update(
        { id: project.id },
        {
          status: ProjectStatus.LATE,
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      );

      const totalDuration = await this.calculateTotalDuration(project.project_type_id);
      this.notificationService.sendProjectDueNotification(project, totalDuration).catch((err) => console.error(`Notification failed: ${err.message}`));
    } catch (error: any) {
      console.error(`${this.traceId} Failed to mark project ${project.id} as due: ${error.message}`);
      throw error;
    }
  }

  private async handleProjectDurationExceeded(project: ProjectModelType, totalDurationDays: number): Promise<void> {
    try {
      await this.projectRepository.update(
        { id: project.id },
        {
          status: ProjectStatus.DUE,
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      );

      this.notificationService.sendProjectDueNotification(project, totalDurationDays).catch((err) => console.error(`Notification failed: ${err.message}`));
    } catch (error: any) {
      console.error(`${this.traceId} Failed to mark project ${project.id} as due: ${error.message}`);
      throw error;
    }
  }

  private async calculateTotalDuration(projectTypeId: string): Promise<number> {
    const milestones = await this.milestonesRepository.findMany({
      project_type_id: projectTypeId,
      deleted_at: null,
    });
    return milestones.reduce((sum, m) => sum + (Number(m.duration) || 0), 0);
  }

  public async enqueueCompanyCheck(companyId: string): Promise<void> {
    console.log(`${this.traceId} Manually triggering check for company ${companyId}`);
    const projects = await this.projectRepository.findMany({
      company_id: companyId,
      status: ProjectStatus.IN_PROGRESS,
      deleted_at: null,
    });

    for (let i = 0; i < projects.length; i += this.BATCH_SIZE) {
      const batch = projects.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map((project) => this.processProjectMilestones(project)));
    }
    console.log(`${this.traceId} Finished manual check for company ${companyId}`);
  }

  public async enqueueProjectCheck(projectId: string): Promise<void> {
    console.log(`${this.traceId} Manually triggering check for project ${projectId}`);
    const project = await this.projectRepository.getProjectAndMembers(projectId);

    if (!project) {
      console.warn(`${this.traceId} Project ${projectId} not found for manual check`);
      return;
    }
    await this.processProjectMilestones(project);
    console.log(`${this.traceId} Finished manual check for project ${projectId}`);
  }
}
