import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { ServiceType } from '@/shared/types/general.type';
import { FormSubmission } from '../models/form-submission.model';
import { FormVersion } from '../models/form-version.model';
import { ContactService } from '@/modules/contact/contact.service';

@injectable()
export class PreFillService {
  constructor(private readonly contactService: ContactService) {}

  async getPreFillData(client_id: string, template_id: string): Promise<ServiceType> {
    try {
      const preFillData: Record<string, any> = {};

      // Get contact profile data for pre-fill
      let contactData: any = null;
      try {
        contactData = await this.contactService.getContactById(client_id);
      } catch {
        // Contact not found — skip profile pre-fill
      }

      // Get the latest version to know which fields have pre_fill_source
      const latestVersion = await FormVersion.query().where({ template_id }).orderBy('version_number', 'desc').first();

      if (latestVersion) {
        const fieldsSnapshot = typeof latestVersion.fields_snapshot === 'string' ? JSON.parse(latestVersion.fields_snapshot) : latestVersion.fields_snapshot;

        // Map contact profile attributes to fields with pre_fill_source
        if (contactData) {
          for (const field of fieldsSnapshot) {
            if (field.pre_fill_source) {
              const mapping: Record<string, string> = {
                name: 'name',
                email: 'email',
                phone: 'phone_number',
              };
              const contactKey = mapping[field.pre_fill_source];
              if (contactKey && contactData[contactKey]) {
                preFillData[field.id] = contactData[contactKey];
              }
            }
          }
        }
      }

      // Get most recent previous submission for this client + template
      const previousSubmission = await FormSubmission.query().where({ template_id, client_id }).orderBy('created_at', 'desc').first();

      if (previousSubmission) {
        const submissionData = typeof previousSubmission.submission_data === 'string' ? JSON.parse(previousSubmission.submission_data) : previousSubmission.submission_data;

        // Merge previous submission data (contact profile takes precedence for mapped fields)
        for (const [fieldId, value] of Object.entries(submissionData)) {
          if (!(fieldId in preFillData)) {
            preFillData[fieldId] = value;
          }
        }
      }

      return { status: true, message: 'Pre-fill data retrieved successfully', data: preFillData };
    } catch (error: any) {
      return { status: false, message: error.message || 'Failed to retrieve pre-fill data', statusCode: StatusCodes.INTERNAL_SERVER_ERROR };
    }
  }
}
