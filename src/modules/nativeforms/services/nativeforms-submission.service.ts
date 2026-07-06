import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

import { NativeformsSubmissionRepository } from '@/repositories/nativeforms_submission.repository';
import { FormLinkRepository } from '@/repositories/form_link.repository';
import { ActivityLogRepository } from '@/repositories/activity_log.repository';
import NotificationRepository from '@/repositories/notification.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { ServiceType } from '@/shared/types/general.type';
import { SubmissionStatus } from '@/models/nativeforms_submission.model';
import { dateTimeFormat } from '@/shared/constants/date.constants';

interface WebhookPayload {
  submission_id: string;
  form_id: string;
  fields: Record<string, unknown>;
  metadata?: {
    project_id?: string;
    task_id?: string;
    client_id?: string;
  };
  submitted_at: string;
}

const VALID_SUBMISSION_STATUSES: SubmissionStatus[] = ['submitted', 'under_review', 'completed', 'info_requested'];

@injectable()
export class NativeformsSubmissionService {
  constructor(
    private readonly submissionRepo: NativeformsSubmissionRepository,
    private readonly formLinkRepo: FormLinkRepository,
    private readonly activityLogRepo: ActivityLogRepository,
    private readonly notificationRepo: NotificationRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  async getByProject(projectId: string): Promise<ServiceType> {
    try {
      const data = await this.submissionRepo.findByProject(projectId);
      return { status: true, message: 'Submissions fetched successfully', data };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to fetch submissions', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async checkSubmission(formLinkId: string, projectId: string): Promise<ServiceType> {
    try {
      const result = await this.submissionRepo.checkSubmission(formLinkId, projectId);
      return { status: true, message: 'Submission check complete', data: result };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to check submission', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async updateSubmissionStatus(submissionId: string, newStatus: SubmissionStatus, reviewerId: string): Promise<ServiceType> {
    try {
      if (!VALID_SUBMISSION_STATUSES.includes(newStatus)) {
        return { status: false, message: `Invalid status. Must be one of: ${VALID_SUBMISSION_STATUSES.join(', ')}`, statusCode: StatusCodes.BAD_REQUEST };
      }

      const submission = await this.submissionRepo.query().where({ id: submissionId }).whereNull('deleted_at').first();
      if (!submission) {
        return { status: false, message: 'Submission not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const updatePayload: any = { status: newStatus };
      if (newStatus === 'under_review' || newStatus === 'completed') {
        updatePayload.reviewed_at = dayjs().format(dateTimeFormat);
        updatePayload.reviewed_by = reviewerId;
      }

      await this.submissionRepo.update({ id: submissionId } as any, updatePayload);

      // If completed, also update the form link status
      if (newStatus === 'completed' && submission.form_link_id) {
        await this.formLinkRepo.update({ id: submission.form_link_id } as any, { status: 'completed' } as any);
      }

      return { status: true, message: `Submission status updated to ${newStatus}` };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to update submission status', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getDashboardStats(organizationId: string): Promise<ServiceType> {
    try {
      const allLinks = await this.formLinkRepo.findByOrgActive(organizationId);

      const awaitingClient = allLinks.filter((l: any) => l.status === 'sent' || l.status === 'awaiting_client');
      const recentlySubmitted = allLinks.filter((l: any) => l.status === 'submitted');
      const underReview = allLinks.filter((l: any) => l.status === 'under_review');

      // Get pending submissions
      const pendingSubmissions = await this.submissionRepo
        .query()
        .where({ organization_id: organizationId })
        .where('status', 'submitted')
        .whereNull('deleted_at')
        .orderBy('submitted_at', 'desc')
        .limit(10);

      return {
        status: true,
        message: 'Dashboard stats fetched',
        data: {
          awaiting_client_count: awaitingClient.length,
          recently_submitted_count: recentlySubmitted.length,
          under_review_count: underReview.length,
          awaiting_client: awaitingClient.slice(0, 5),
          recently_submitted: pendingSubmissions,
          under_review: underReview.slice(0, 5),
        },
      };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to fetch dashboard stats', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async processWebhook(webhookSecret: string, providedSecret: string, payload: WebhookPayload): Promise<ServiceType> {
    if (!webhookSecret) {
      return { status: false, message: 'Service unavailable', statusCode: StatusCodes.SERVICE_UNAVAILABLE };
    }
    if (providedSecret !== webhookSecret) {
      return { status: false, message: 'Unauthorized', statusCode: StatusCodes.UNAUTHORIZED };
    }
    if (!payload.submission_id || !payload.form_id || !payload.fields || !payload.submitted_at) {
      return { status: false, message: 'Invalid payload: missing required fields', statusCode: StatusCodes.BAD_REQUEST };
    }

    try {
      // Idempotency
      const existing = await this.submissionRepo.findBySubmissionId(payload.submission_id);
      if (existing) {
        return { status: true, message: 'Submission already processed' };
      }

      const projectId = payload.metadata?.project_id || null;
      const taskId = payload.metadata?.task_id || null;
      const clientId = payload.metadata?.client_id || null;

      // Resolve form link
      let formLinkId: string | null = null;
      let organizationId: string | null = null;
      let displayName: string | null = null;
      let formUrl: string | null = null;

      const matchingLink = await this.formLinkRepo.query().whereNull('deleted_at').where('form_url', 'like', `%${payload.form_id}%`).first();

      if (matchingLink) {
        formLinkId = matchingLink.id;
        organizationId = matchingLink.organization_id;
        displayName = matchingLink.display_name;
        formUrl = matchingLink.form_url;

        // Update form link status to 'submitted'
        await this.formLinkRepo.update({ id: formLinkId } as any, { status: 'submitted' } as any);
      }

      // Create submission
      await this.submissionRepo.create({
        organization_id: organizationId || 'unknown',
        form_link_id: formLinkId,
        submission_id: payload.submission_id,
        project_id: projectId,
        task_id: taskId,
        client_id: clientId,
        form_url: formUrl,
        display_name: displayName,
        submitted_data: JSON.stringify(payload.fields),
        raw_payload: JSON.stringify(payload),
        submitted_at: payload.submitted_at,
        status: 'submitted',
      } as any);

      // Create notifications for all admins in the org
      if (organizationId) {
        try {
          // Get project name for context
          let projectName = 'Unknown Project';
          if (projectId) {
            const project = await this.projectRepo.getById(projectId);
            if (project) projectName = (project as any).name || projectName;
          }

          // Notify — we create one notification for the org; in production you'd query admin users
          await this.notificationRepo.create({
            user_id: organizationId, // This should ideally be admin user IDs
            type: 'nativeforms_submission',
            title: 'Form Submitted',
            message: `Client submitted "${displayName || 'a form'}" for project "${projectName}"`,
            data: JSON.stringify({ form_link_id: formLinkId, project_id: projectId, submission_id: payload.submission_id }),
            is_read: false,
          } as any);
        } catch (err) {
          console.error('Failed to create notification for NativeForms submission:', err);
        }
      }

      // Audit trail
      if (projectId && organizationId) {
        try {
          await this.activityLogRepo.create({
            organization_id: organizationId,
            project_id: projectId,
            user_id: clientId,
            action: 'NATIVEFORMS_SUBMISSION_RECEIVED',
            description: `NativeForms submission received: ${displayName || 'Unknown form'}`,
            metadata: JSON.stringify({ form_link_id: formLinkId, submission_id: payload.submission_id }),
          } as any);
        } catch (err) {
          console.error('Failed to create audit trail:', err);
        }
      }

      return { status: true, message: 'Submission processed successfully' };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to process webhook', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
