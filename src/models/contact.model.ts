import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class Contact extends BaseModel {
  static tableName = 'contacts';

  // Add JSON schema definition
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'email', 'phone'], // Add required fields here
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        organization: { type: 'string' },
        address: { type: 'string' },
        active_projects: { type: 'string' },
        total_projects: { type: 'string' },
        no_of_projects: { type: 'string' },
        closed_projects: { type: 'string' },
        assigne: {
          type: 'array',
          items: { type: 'string' },
          default: [], // Schema-level default (handled by Objection, not DB)
        },
      },
    };
  }

  // Specify which fields should be treated as JSON
  static get jsonAttributes() {
    return ['assigne'];
  }

  // Model properties
  name: string;
  email: string;
  phone: string;
  organization: string;
  address: string;
  active_projects: string;
  total_projects: string;
  no_of_projects: string;
  closed_projects: string;
  assigne: string[];
}

export type ContactModelType = ModelObject<Contact>;
