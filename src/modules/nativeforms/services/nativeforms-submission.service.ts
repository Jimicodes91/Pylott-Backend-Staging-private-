import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { NativeformsSubmissionRepository } from '@/repositories/nativeforms_submission.repository';
import { FormLinkRepository } from '@/repositories/form_link.repository';
import { ActivityLogRepository } from '@/repositories/activity_log.repository';
import { ServiceType } from '@/shared/types/general.type';

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

@injectable()
export class NativeformsSubmissionService {
  constructor(
    private readonly submissionRepo: NativeformsSubmissionRepository,
    private readonly formLinkRepo: FormLinkRepository,
    private readonly activityLogRepo: ActivityLogRepository,
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

  async processWebhook(webhookSecret: string, providedSecret: string, payload: WebhookPayload): Promise<ServiceType> {
    // Validate webhook secret is configured
    if (!webhookSecret) {
      return { status: false, message: 'Service unavailable', statusCode: StatusCodes.SERVICE_UNAVAILABLE };
    }

    // Validate provided secret matches
    if (providedSecret !== webhookSecret) {
      return { status: false, message: 'Unauthorized', statusCode: StatusCodes.UNAUTHORIZED };
    }

    // Validate required fields
    if (!payload.submission_id || !payload.form_id || !payload.fields || !payload.submitted_at) {
      return { status: false, message: 'Invalid payload: missing required fields', statusCode: StatusCodes.BAD_REQUEST };
    }

    try {
      // Idempotency check — if submission already exists, return success
      const existing = await this.submissionRepo.findBySubmissionId(payload.submission_id);
      if (existing) {
        return { status: true, message: 'Submission already processed' };
      }

      const projectId = payload.metadata?.project_id || null;
      const taskId = payload.metadata?.task_id || null;
      const clientId = payload.metadata?.client_id || null;

      // Try to find a matching form link by form_id in URL
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
      }

      // Create submission record
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
      } as any);

      // Log audit trail if we have a project
      if (projectId && organizationId) {
        try {
          await this.activityLogRepo.create({
            organization_id: organizationId,
            project_id: projectId,
            user_id: clientId,
            action: 'NATIVEFORMS_SUBMISSION_RECEIVED',
            description: `NativeForms submission received: ${displayName || 'Unknown form'}`,
            metadata: JSON.stringify({
              form_link_id: formLinkId,
              submission_id: payload.submission_id,
              submitted_at: payload.submitted_at,
            }),
          } as any);
        } catch (err) {
          console.error('Failed to create audit trail for NativeForms submission:', err);
        }
      }

      return { status: true, message: 'Submission processed successfully' };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to process webhook', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
