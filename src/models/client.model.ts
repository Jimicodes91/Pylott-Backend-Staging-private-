import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';

export type ClientPlan = 'Basic' | 'Premium';

export class Client extends BaseModel {
  static tableName = 'clients';

  user_id!: string;
  company_id!: string;
  serial_number!: string;
  plan!: ClientPlan;
  contact_person?: string;
  billing_address?: string;
  is_active?: boolean;

  // Relations
  projects?: Array<any>;
  user?: User;

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: __dirname + '/user.model',
        join: {
          from: 'clients.user_id',
          to: 'users.id',
        },
      },
      projects: {
        relation: BaseModel.HasManyRelation,
        modelClass: __dirname + '/project.model',
        join: {
          from: 'clients.id',
          to: 'projects.client_id',
        },
      },
    };
  }
}

export type ClientModelType = ModelObject<Client>;
