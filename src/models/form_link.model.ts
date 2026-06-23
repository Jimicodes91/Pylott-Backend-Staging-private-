import BaseModel from './base.model';

export class FormLink extends BaseModel {
  static tableName = 'form_links';

  organization_id: string;
  form_url: string;
  display_name: string;
  project_type_id: string | null;
  milestone_id: string | null;
  sort_order: number;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['form_url', 'display_name', 'organization_id'],
      properties: {
        id: { type: 'string' },
        organization_id: { type: 'string' },
        form_url: { type: 'string', maxLength: 2048 },
        display_name: { type: 'string', maxLength: 255 },
        project_type_id: { type: ['string', 'null'] },
        milestone_id: { type: ['string', 'null'] },
        sort_order: { type: 'integer', default: 0 },
        deleted_at: { type: ['string', 'null'] },
      },
    };
  }
}

export type FormLinkModelType = FormLink;
