import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { ServiceType } from '@/shared/types/general.type';
import { FormTemplate } from '../models/form-template.model';
import { FormField } from '../models/form-field.model';
import { FormSubmission } from '../models/form-submission.model';
import { FormVersion } from '../models/form-version.model';
import { CreateTemplateDto, UpdateTemplateDto } from '../forms.dto';

@injectable()
export class FormTemplateService {
  async create(company_id: string, created_by: string, data: CreateTemplateDto): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().insert({
        id: uuidv4(),
        company_id,
        name: data.name,
        description: data.description || null,
        status: 'draft',
        created_by,
      });

      return { status: true, message: 'Form template created successfully', data: template, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to create form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getAll(company_id: string, search?: string): Promise<ServiceType> {
    try {
      let query = FormTemplate.query().where({ company_id }).whereNull('deleted_at').orderBy('updated_at', 'desc');

      if (search) {
        query = query.where('name', 'like', `%${search}%`);
      }

      const templates = await query;
      return { status: true, message: 'Form templates retrieved successfully', data: templates };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve form templates', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getById(company_id: string, template_id: string): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().findById(template_id).whereNull('deleted_at');

      if (!template) {
        return { status: false, message: 'Form template not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (template.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');

      return { status: true, message: 'Form template retrieved successfully', data: { ...template, fields } };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async update(company_id: string, template_id: string, data: UpdateTemplateDto): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().findById(template_id).whereNull('deleted_at');

      if (!template) {
        return { status: false, message: 'Form template not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (template.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      const updated = await FormTemplate.query().patchAndFetchById(template_id, {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      });

      return { status: true, message: 'Form template updated successfully', data: updated };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to update form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async delete(company_id: string, template_id: string): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().findById(template_id).whereNull('deleted_at');

      if (!template) {
        return { status: false, message: 'Form template not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (template.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      // Check for existing submissions
      const submissions = await FormSubmission.query().where({ template_id }).limit(1);
      if (submissions.length > 0) {
        return { status: false, message: 'Cannot delete a template that has existing submissions', statusCode: StatusCodes.BAD_REQUEST };
      }

      await FormTemplate.query().patchAndFetchById(template_id, {
        deleted_at: new Date().toISOString(),
      });

      return { status: true, message: 'Form template deleted successfully' };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to delete form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async clone(company_id: string, template_id: string, created_by: string): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().findById(template_id).whereNull('deleted_at');

      if (!template) {
        return { status: false, message: 'Form template not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (template.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      const newTemplateId = uuidv4();
      const clonedTemplate = await FormTemplate.query().insert({
        id: newTemplateId,
        company_id,
        name: `${template.name} (Copy)`,
        description: template.description,
        status: 'draft',
        created_by,
      });

      // Copy all fields
      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');
      for (const field of fields) {
        await FormField.query().insert({
          id: uuidv4(),
          template_id: newTemplateId,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          help_text: field.help_text,
          sort_order: field.sort_order,
          validation_rules: field.validation_rules,
          conditional_rule: field.conditional_rule,
          pre_fill_source: field.pre_fill_source,
          options: field.options,
          file_config: field.file_config,
        });
      }

      return { status: true, message: 'Form template cloned successfully', data: clonedTemplate, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to clone form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async publish(company_id: string, template_id: string, created_by: string): Promise<ServiceType> {
    try {
      const template = await FormTemplate.query().findById(template_id).whereNull('deleted_at');

      if (!template) {
        return { status: false, message: 'Form template not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (template.company_id !== company_id) {
        return { status: false, message: 'Access denied. You do not have permission to access this resource.', statusCode: StatusCodes.FORBIDDEN };
      }

      // Get current fields for snapshot
      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');
      if (fields.length === 0) {
        return { status: false, message: 'Cannot publish a template with no fields', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Get latest version number
      const latestVersion = await FormVersion.query().where({ template_id }).orderBy('version_number', 'desc').first();

      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

      // Create version with fields snapshot
      const version = await FormVersion.query().insert({
        id: uuidv4(),
        template_id,
        version_number: nextVersionNumber,
        fields_snapshot: JSON.stringify(fields),
        created_by,
      });

      // Update template status to published
      await FormTemplate.query().patchAndFetchById(template_id, { status: 'published' });

      return { status: true, message: 'Form template published successfully', data: version, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to publish form template', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
