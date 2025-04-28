import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Project } from './project.model';
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
  projects?: Project[];
  user?: User;

  static relationMappings = (): ModelsRelationMapping => ({
    projects: {
      relation: BaseModel.HasManyRelation,
      modelClass: Project,
      join: {
        from: 'clients.id',
        to: 'projects.client_id',
      },
    },
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'clients.user_id',
        to: 'users.id',
      },
    },
  });
}

export type ClientModelType = ModelObject<Client>;
