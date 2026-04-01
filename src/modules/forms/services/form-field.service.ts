import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { ServiceType } from '@/shared/types/general.type';
import { FormField } from '../models/form-field.model';
import { FormTemplate } from '../models/form-template.model';
import { CreateFieldDto, UpdateFieldDto } from '../forms.dto';

const OPTION_REQUIRED_TYPES = ['dropdown', 'checkboxes', 'radio'];

@injectable()
export class FormFieldService {
  async getByTemplate(template_id: string): Promise<ServiceType> {
    try {
      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');

      return { status: true, message: 'Fields retrieved successfully', data: fields };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve fields', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async create(template_id: string, data: CreateFieldDto): Promise<ServiceType> {
    try {
      // Validate required attributes
      if (!data.label || !data.type) {
        return { status: false, message: 'Label and type are required', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Validate options for select-type fields
      if (OPTION_REQUIRED_TYPES.includes(data.type)) {
        if (!data.options || data.options.length === 0) {
          return { status: false, message: `At least one option is required for ${data.type} fields`, statusCode: StatusCodes.BAD_REQUEST };
        }
      }

      // Validate conditional rule source ordering
      if (data.conditional_rule) {
        const sourceField = await FormField.query().where({ template_id, id: data.conditional_rule.source_field_id }).first();

        if (!sourceField) {
          return { status: false, message: 'Conditional rule source field not found', statusCode: StatusCodes.BAD_REQUEST };
        }

        if (sourceField.sort_order >= data.sort_order) {
          return { status: false, message: 'Source field must appear before the target field in sort order', statusCode: StatusCodes.BAD_REQUEST };
        }
      }

      const field = await FormField.query().insert({
        id: uuidv4(),
        template_id,
        type: data.type,
        label: data.label,
        placeholder: data.placeholder || null,
        help_text: data.help_text || null,
        sort_order: data.sort_order,
        validation_rules: data.validation_rules ? JSON.stringify(data.validation_rules) : null,
        conditional_rule: data.conditional_rule ? JSON.stringify(data.conditional_rule) : null,
        pre_fill_source: data.pre_fill_source || null,
        options: data.options ? JSON.stringify(data.options) : null,
        file_config: data.file_config ? JSON.stringify(data.file_config) : null,
      });

      // Update template updated_at
      await FormTemplate.query().patch({}).where({ id: template_id });

      return { status: true, message: 'Field created successfully', data: field, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to create field', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async update(field_id: string, template_id: string, data: UpdateFieldDto): Promise<ServiceType> {
    try {
      const field = await FormField.query().findById(field_id).where({ template_id });
      if (!field) {
        return { status: false, message: 'Field not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const patchData: any = {};
      if (data.label !== undefined) patchData.label = data.label;
      if (data.placeholder !== undefined) patchData.placeholder = data.placeholder;
      if (data.help_text !== undefined) patchData.help_text = data.help_text;
      if (data.sort_order !== undefined) patchData.sort_order = data.sort_order;
      if (data.validation_rules !== undefined) patchData.validation_rules = JSON.stringify(data.validation_rules);
      if (data.conditional_rule !== undefined) patchData.conditional_rule = JSON.stringify(data.conditional_rule);
      if (data.pre_fill_source !== undefined) patchData.pre_fill_source = data.pre_fill_source;
      if (data.options !== undefined) patchData.options = JSON.stringify(data.options);
      if (data.file_config !== undefined) patchData.file_config = JSON.stringify(data.file_config);

      const updated = await FormField.query().patchAndFetchById(field_id, patchData);

      // Update template updated_at
      await FormTemplate.query().patch({}).where({ id: template_id });

      return { status: true, message: 'Field updated successfully', data: updated };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to update field', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async delete(field_id: string, template_id: string): Promise<ServiceType> {
    try {
      const field = await FormField.query().findById(field_id).where({ template_id });
      if (!field) {
        return { status: false, message: 'Field not found', statusCode: StatusCodes.NOT_FOUND };
      }

      await FormField.query().deleteById(field_id);

      // Update template updated_at
      await FormTemplate.query().patch({}).where({ id: template_id });

      return { status: true, message: 'Field deleted successfully' };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to delete field', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async reorder(template_id: string, fieldOrders: { id: string; sort_order: number }[]): Promise<ServiceType> {
    try {
      const trx = await FormField.startTransaction();
      try {
        for (const item of fieldOrders) {
          await FormField.query(trx).patch({ sort_order: item.sort_order }).where({ id: item.id, template_id });
        }
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }

      // Update template updated_at
      await FormTemplate.query().patch({}).where({ id: template_id });

      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');

      return { status: true, message: 'Fields reordered successfully', data: fields };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to reorder fields', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
