import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { ServiceType } from '@/shared/types/general.type';
import { FormVersion } from '../models/form-version.model';
import { FormField } from '../models/form-field.model';

@injectable()
export class FormVersionService {
  async createVersion(template_id: string, created_by: string): Promise<ServiceType> {
    try {
      // Get current fields for snapshot
      const fields = await FormField.query().where({ template_id }).orderBy('sort_order', 'asc');

      if (fields.length === 0) {
        return { status: false, message: 'Cannot create version for a template with no fields', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Get latest version number
      const latestVersion = await FormVersion.query().where({ template_id }).orderBy('version_number', 'desc').first();

      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

      const version = await FormVersion.query().insert({
        id: uuidv4(),
        template_id,
        version_number: nextVersionNumber,
        fields_snapshot: JSON.stringify(fields),
        created_by,
      });

      return { status: true, message: 'Version created successfully', data: version, statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to create version', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getVersions(template_id: string): Promise<ServiceType> {
    try {
      const versions = await FormVersion.query().where({ template_id }).orderBy('version_number', 'desc');

      return { status: true, message: 'Versions retrieved successfully', data: versions };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve versions', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getVersion(template_id: string, version_number: number): Promise<ServiceType> {
    try {
      const version = await FormVersion.query().where({ template_id, version_number }).first();

      if (!version) {
        return { status: false, message: 'Version not found', statusCode: StatusCodes.NOT_FOUND };
      }

      return { status: true, message: 'Version retrieved successfully', data: version };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve version', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }

  async getLatestVersion(template_id: string): Promise<ServiceType> {
    try {
      const version = await FormVersion.query().where({ template_id }).orderBy('version_number', 'desc').first();

      if (!version) {
        return { status: false, message: 'Template has no published version', statusCode: StatusCodes.NOT_FOUND };
      }

      return { status: true, message: 'Latest version retrieved successfully', data: version };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve latest version', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
