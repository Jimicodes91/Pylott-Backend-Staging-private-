import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

import { ServiceType } from '@/shared/types/general.type';
import { FormSubmission } from '../models/form-submission.model';
import { FormVersion } from '../models/form-version.model';
import { FormTemplate } from '../models/form-template.model';
import { ProjectTask } from '@/models/project_task.model';
import { FormValidationService } from './form-validation.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from '../forms.dto';

@injectable()
export class FormSubmissionService {
  constructor(private readonly validationService: FormValidationService) {}

  async create(data: CreateSubmissionDto): Promise<ServiceType> {
    try {
      // Validate task exists and has native form mode
      const task = await ProjectTask.query().findById(data.task_id);
      if (!task) {
        return { status: false, message: 'Task not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const formConfig = typeof task.form_config === 'string' ? JSON.parse(task.form_config) : task.form_config;

      if (!formConfig || formConfig.mode !== 'native') {
        return { status: false, message: 'Task does not have native form mode configured', statusCode: StatusCodes.BAD_REQUEST };
      }

      if (formConfig.form_id !== data.template_id) {
        return { status: false, message: "Form template does not match the task's configured form", statusCode: StatusCodes.BAD_REQUEST };
      }

      // Get latest published version
      const latestVersion = await FormVersion.query().where({ template_id: data.template_id }).orderBy('version_number', 'desc').first();

      if (!latestVersion) {
        return { status: false, message: 'Template has no published version', statusCode: StatusCodes.BAD_REQUEST };
      }

      // For submitted status, run server-side validation
      if (data.status === 'submitted') {
        const fieldsSnapshot = typeof latestVersion.fields_snapshot === 'string' ? JSON.parse(latestVersion.fields_snapshot) : latestVersion.fields_snapshot;

        const validationResult = this.validationService.validateSubmission(fieldsSnapshot, data.submission_data, data.submission_data);

        if (!validationResult.valid) {
          return {
            status: false,
            message: 'Validation failed',
            data: { errors: validationResult.errors },
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      // Check for existing draft — overwrite if exists
      const existing = await FormSubmission.query().where({ task_id: data.task_id, client_id: data.client_id }).first();

      if (existing) {
        if (existing.status === 'submitted') {
          return { status: false, message: 'Cannot modify a submitted form submission', statusCode: StatusCodes.BAD_REQUEST };
        }

        // Overwrite existing draft
        const updated = await FormSubmission.query().patchAndFetchById(existing.id, {
          submission_data: JSON.stringify(data.submission_data),
          version_number: latestVersion.version_number,
          status: data.status,
          ...(data.status === 'submitted' && { submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss') }),
        });

        // Auto-complete task if flag is set
        if (data.status === 'submitted' && formConfig.auto_complete_on_submit) {
          await ProjectTask.query()
            .patch({ status: 'completed' as any })
            .where({ id: data.task_id });
        }

        return { status: true, message: 'Submission updated successfully', data: updated };
      }

      // Create new submission
      const submission = await FormSubmission.query().insert({
        id: uuidv4(),
        template_id: data.template_id,
        version_number: latestVersion.version_number,
        task_id: data.task_id,
        client_id: data.client_id,
        project_id: data.project_id,
        company_id: data.company_id,
        submission_data: JSON.stringify(data.submission_data),
        status: data.status,
        ...(data.status === 'submitted' && { submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss') }),
      });

      // Auto-complete task if flag is set
      if (data.status === 'submitted' && formConfig.auto_complete_on_submit) {
        await ProjectTask.query()
          .patch({ status: 'completed' as any })
          .where({ id: data.task_id });
      }

      return { status: true, message: 'Submission created successfully', data: submission, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to create submission', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async update(submission_id: string, company_id: string, data: UpdateSubmissionDto): Promise<ServiceType> {
    try {
      const submission = await FormSubmission.query().findById(submission_id);
      if (!submission) {
        return { status: false, message: 'Submission not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (submission.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      if (submission.status === 'submitted') {
        return { status: false, message: 'Cannot modify a submitted form submission', statusCode: StatusCodes.BAD_REQUEST };
      }

      const updated = await FormSubmission.query().patchAndFetchById(submission_id, {
        submission_data: JSON.stringify(data.submission_data),
      });

      return { status: true, message: 'Submission updated successfully', data: updated };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to update submission', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getByTask(task_id: string, company_id: string): Promise<ServiceType> {
    try {
      const submissions = await FormSubmission.query().where({ task_id, company_id });

      return { status: true, message: 'Submissions retrieved successfully', data: submissions };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve submissions', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getByTemplate(template_id: string, company_id: string): Promise<ServiceType> {
    try {
      const submissions = await FormSubmission.query().where({ template_id, company_id });

      return { status: true, message: 'Submissions retrieved successfully', data: submissions };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve submissions', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async finalize(submission_id: string, company_id: string): Promise<ServiceType> {
    try {
      const submission = await FormSubmission.query().findById(submission_id);
      if (!submission) {
        return { status: false, message: 'Submission not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (submission.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      if (submission.status === 'submitted') {
        return { status: false, message: 'Submission is already finalized', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Run server-side validation before finalizing
      const latestVersion = await FormVersion.query().where({ template_id: submission.template_id }).orderBy('version_number', 'desc').first();

      if (latestVersion) {
        const fieldsSnapshot = typeof latestVersion.fields_snapshot === 'string' ? JSON.parse(latestVersion.fields_snapshot) : latestVersion.fields_snapshot;

        const submissionData = typeof submission.submission_data === 'string' ? JSON.parse(submission.submission_data) : submission.submission_data;

        const validationResult = this.validationService.validateSubmission(fieldsSnapshot, submissionData, submissionData);

        if (!validationResult.valid) {
          return {
            status: false,
            message: 'Validation failed',
            data: { errors: validationResult.errors },
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      const updated = await FormSubmission.query().patchAndFetchById(submission_id, {
        status: 'submitted',
        submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });

      // Check for auto-complete
      const task = await ProjectTask.query().findById(submission.task_id);
      if (task) {
        const formConfig = typeof task.form_config === 'string' ? JSON.parse(task.form_config) : task.form_config;

        if (formConfig?.auto_complete_on_submit) {
          await ProjectTask.query()
            .patch({ status: 'completed' as any })
            .where({ id: submission.task_id });
        }
      }

      return { status: true, message: 'Submission finalized successfully', data: updated };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to finalize submission', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
