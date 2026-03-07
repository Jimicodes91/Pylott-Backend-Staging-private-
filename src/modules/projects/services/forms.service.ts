import { injectable } from 'tsyringe';
import { ProjectFormFieldRepository, ProjectFormsRepository } from '@/repositories';
import { ServiceType } from '@/shared/types/general.type';
import { Model } from 'objection';
import { AddCustomField } from '@/shared/types/projects.type';
import { ProjectFormFieldModelType } from '@/models/project_form_fields.model';

@injectable()
export class ProjectFormService {
  private readonly traceId = '[ProjectFormService]';

  constructor(
    private readonly formRepository: ProjectFormsRepository,
    private readonly fieldRepository: ProjectFormFieldRepository,
  ) {}

  async getProjectForm(company_id: string): Promise<ServiceType> {
    try {
      console.log(`${this.traceId} Fetching project form for company: ${company_id}`);

      const form = await this.formRepository.getCompanyForm(company_id);

      if (!form) {
        console.log(`${this.traceId} No form found for company ${company_id}, initializing default form`);
        return await this.initializeDefaultForm(company_id);
      }

      console.log(`${this.traceId} Successfully fetched project form for company: ${company_id}`);
      return {
        status: true,
        message: 'Project form fetched successfully',
        data: form,
      };
    } catch (error) {
      console.error(`${this.traceId} Error fetching project form for company ${company_id}:`, error);
      return {
        status: false,
        message: 'Failed to fetch project form',
        data: null,
      };
    }
  }

  private async initializeDefaultForm(company_id: string): Promise<ServiceType> {
    const defaultFields: Array<Partial<ProjectFormFieldModelType>> = [
      { name: 'Project name', type: 'text', is_required: true, is_custom: false, sort_order: 1 },
      { name: 'Journey', type: 'select', is_required: true, is_custom: false, sort_order: 2, options: [], api_locator: 'journey-list' },
      { name: 'Description', type: 'text', is_required: false, is_custom: false, sort_order: 3 },
      { name: 'Project Client', type: 'select', is_required: false, is_custom: false, sort_order: 4, api_locator: 'contact-list', is_multiple: true },
      { name: 'Client Organization', type: 'text', is_required: true, is_custom: false, sort_order: 5 },
      { name: 'Project value', type: 'number', is_required: false, is_custom: false, sort_order: 6 },
      { name: 'Nationality', type: 'text', is_required: false, is_custom: false, sort_order: 7 },
      { name: 'Resident country', type: 'text', is_required: false, is_custom: false, sort_order: 8 },
      { name: 'Post code', type: 'text', is_required: false, is_custom: false, sort_order: 9 },
      { name: 'Phone number', type: 'text', is_required: false, is_custom: false, sort_order: 10 },
      { name: 'Email address', type: 'text', is_required: false, is_custom: false, sort_order: 11 },
      { name: 'Start date', type: 'date', is_required: true, is_custom: false, sort_order: 12 },
      { name: 'End date', type: 'date', is_required: false, is_custom: false, sort_order: 13 },
    ];

    let form;

    try {
      console.log(`${this.traceId} Initializing default form for company: ${company_id}`);

      await Model.transaction(async (trx) => {
        form = await this.formRepository.create(
          {
            company_id,
            name: 'Default Project Form',
            is_active: true,
          },
          trx,
        );

        for (const field of defaultFields) {
          const fieldData = {
            ...field,
            form_id: form.id,
            company_id,
            options: field?.options && field?.options?.length ? field.options : null,
          };
          await this.fieldRepository.create(fieldData as any, trx);
        }
      });

      console.log(`${this.traceId} Successfully initialized default form for company: ${company_id}`);
      return {
        status: true,
        message: 'Default project form initialized',
        data: { ...form, fields: defaultFields },
      };
    } catch (error) {
      console.error(`${this.traceId} Error initializing default form for company ${company_id}:`, error);
      return {
        status: false,
        message: 'Failed to initialize default form',
        data: null,
      };
    }
  }

  async addCustomField(company_id: string, fieldData: AddCustomField): Promise<ServiceType> {
    try {
      console.log(`${this.traceId} Adding custom field for company: ${company_id}`, fieldData);

      const form = await this.formRepository.getCompanyForm(company_id);
      if (!form) {
        console.warn(`${this.traceId} No form found for company: ${company_id}`);
        return { status: false, message: 'Project form not found' };
      }

      const maxOrder = await this.fieldRepository.getMaxOrder(form.id);
      const formData = {
        ...fieldData,
        company_id,
        form_id: form.id,
        is_custom: true,
        is_required: fieldData.is_required || false,
        sort_order: maxOrder + 1,
        options: fieldData?.options?.length ? JSON.stringify(fieldData.options) : JSON.stringify([]),
      };

      const field = await this.fieldRepository.create(formData as any);

      console.log(`${this.traceId} Successfully added custom field for company: ${company_id}`, field);
      return {
        status: true,
        message: 'Custom field added successfully',
        data: field,
      };
    } catch (error) {
      console.error(`${this.traceId} Error adding custom field for company ${company_id}:`, error);
      return {
        status: false,
        message: 'Failed to add custom field',
        data: null,
      };
    }
  }

  async updateFieldRequirement(company_id: string, field_id: string, is_required: boolean): Promise<ServiceType> {
    try {
      console.log(`${this.traceId} Updating field requirement`, { company_id, field_id, is_required });

      const form = await this.formRepository.getCompanyForm(company_id);
      if (!form) {
        console.warn(`${this.traceId} No form found for company: ${company_id}`);
        return { status: false, message: 'Project form not found' };
      }

      await this.fieldRepository.update({ id: field_id, form_id: form.id }, { is_required });

      console.log(`${this.traceId} Successfully updated field requirement`, { company_id, field_id, is_required });
      return {
        status: true,
        message: 'Field requirement updated successfully',
      };
    } catch (error) {
      console.error(`${this.traceId} Error updating field requirement:`, error);
      return {
        status: false,
        message: 'Failed to update field requirement',
      };
    }
  }
}
