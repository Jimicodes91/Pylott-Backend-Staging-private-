import BaseModel from './base.model';

export class NativeformsSubmission extends BaseModel {
  static tableName = 'nativeforms_submissions';

  organization_id: string;
  form_link_id: string | null;
  submission_id: string;
  project_id: string | null;
  task_id: string | null;
  client_id: string | null;
  form_url: string | null;
  display_name: string | null;
  submitted_data: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  submitted_at: string;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['submission_id', 'organization_id', 'submitted_data', 'raw_payload', 'submitted_at'],
      properties: {
        id: { type: 'string' },
        organization_id: { type: 'string' },
        form_link_id: { type: ['string', 'null'] },
        submission_id: { type: 'string', maxLength: 255 },
        project_id: { type: ['string', 'null'] },
        task_id: { type: ['string', 'null'] },
        client_id: { type: ['string', 'null'] },
        form_url: { type: ['string', 'null'] },
        display_name: { type: ['string', 'null'] },
        submitted_data: { type: 'object' },
        raw_payload: { type: 'object' },
        submitted_at: { type: 'string' },
        deleted_at: { type: ['string', 'null'] },
      },
    };
  }
}

export type NativeformsSubmissionModelType = NativeformsSubmission;
