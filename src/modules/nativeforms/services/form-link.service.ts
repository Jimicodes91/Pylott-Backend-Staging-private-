import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { FormLinkRepository } from '@/repositories/form_link.repository';
import { ServiceType } from '@/shared/types/general.type';

const NATIVEFORMS_URL_REGEX = /^https:\/\/(.*\.)?nativeforms\.com\/.+$/;

interface CreateFormLinkDto {
  form_url: string;
  display_name: string;
  project_type_id?: string;
  milestone_id?: string;
  sort_order?: number;
}

interface UpdateFormLinkDto {
  form_url?: string;
  display_name?: string;
  project_type_id?: string;
  milestone_id?: string;
  sort_order?: number;
}

@injectable()
export class FormLinkService {
  constructor(private readonly formLinkRepo: FormLinkRepository) {}

  async getAll(organizationId: string): Promise<ServiceType> {
    try {
      const data = await this.formLinkRepo.findByOrgActive(organizationId);
      return { status: true, message: 'Form links fetched successfully', data };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to fetch form links', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getById(organizationId: string, id: string): Promise<ServiceType> {
    try {
      const formLink = await this.formLinkRepo.findOne({ id, organization_id: organizationId } as any);
      if (!formLink) {
        return { status: false, message: 'Form link not found', statusCode: StatusCodes.NOT_FOUND };
      }
      return { status: true, message: 'Form link fetched successfully', data: formLink };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to fetch form link', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getByProject(organizationId: string, projectTypeId: string, milestoneId: string): Promise<ServiceType> {
    try {
      const data = await this.formLinkRepo.findByProjectContext(organizationId, projectTypeId, milestoneId);
      return { status: true, message: 'Form links fetched successfully', data };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to fetch form links', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async create(organizationId: string, dto: CreateFormLinkDto): Promise<ServiceType> {
    try {
      // Validate URL
      if (!NATIVEFORMS_URL_REGEX.test(dto.form_url)) {
        return { status: false, message: 'URL must be a valid NativeForms URL (https://[subdomain.]nativeforms.com/...)', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Validate display_name
      if (!dto.display_name || dto.display_name.trim().length === 0) {
        return { status: false, message: 'Display name is required', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Validate at least one association
      if (!dto.project_type_id && !dto.milestone_id) {
        return { status: false, message: 'At least one of project_type_id or milestone_id must be provided', statusCode: StatusCodes.BAD_REQUEST };
      }

      const data = await this.formLinkRepo.create({
        organization_id: organizationId,
        form_url: dto.form_url,
        display_name: dto.display_name.trim(),
        project_type_id: dto.project_type_id || null,
        milestone_id: dto.milestone_id || null,
        sort_order: dto.sort_order ?? 0,
      } as any);

      return { status: true, message: 'Form link created successfully', data, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to create form link', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async update(organizationId: string, id: string, dto: UpdateFormLinkDto): Promise<ServiceType> {
    try {
      const existing = await this.formLinkRepo.findOne({ id, organization_id: organizationId } as any);
      if (!existing) {
        return { status: false, message: 'Form link not found', statusCode: StatusCodes.NOT_FOUND };
      }

      // Validate URL if provided
      if (dto.form_url && !NATIVEFORMS_URL_REGEX.test(dto.form_url)) {
        return { status: false, message: 'URL must be a valid NativeForms URL', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Validate display_name if provided
      if (dto.display_name !== undefined && dto.display_name.trim().length === 0) {
        return { status: false, message: 'Display name cannot be empty', statusCode: StatusCodes.BAD_REQUEST };
      }

      const updatePayload: any = {};
      if (dto.form_url !== undefined) updatePayload.form_url = dto.form_url;
      if (dto.display_name !== undefined) updatePayload.display_name = dto.display_name.trim();
      if (dto.project_type_id !== undefined) updatePayload.project_type_id = dto.project_type_id || null;
      if (dto.milestone_id !== undefined) updatePayload.milestone_id = dto.milestone_id || null;
      if (dto.sort_order !== undefined) updatePayload.sort_order = dto.sort_order;

      await this.formLinkRepo.update({ id } as any, updatePayload);

      const updated = await this.formLinkRepo.getById(id);
      return { status: true, message: 'Form link updated successfully', data: updated };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to update form link', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async softDelete(organizationId: string, id: string): Promise<ServiceType> {
    try {
      const existing = await this.formLinkRepo.findOne({ id, organization_id: organizationId } as any);
      if (!existing) {
        return { status: false, message: 'Form link not found', statusCode: StatusCodes.NOT_FOUND };
      }

      await this.formLinkRepo.delete({ id } as any, true);
      return { status: true, message: 'Form link deleted successfully' };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to delete form link', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
