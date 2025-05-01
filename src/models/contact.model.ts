import { ModelObject } from 'objection';
import BaseModel from './base.model';

interface Assignee {
  id: string;
  name: string;
}

export class Contact extends BaseModel {
  static tableName = 'contacts';

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'email', 'phone'],
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
          default: [],
        },
        assigned_to: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
          default: [],
        },
      },
    };
  }

  static get jsonAttributes() {
    return ['assigne', 'assigned_to'];
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
  assigne: string[]; // Keep for backward compatibility
  assigned_to: Assignee[]; // New field
}

export type ContactModelType = ModelObject<Contact>;
