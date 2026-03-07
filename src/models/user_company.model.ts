import { ModelObject } from 'objection';

import { UserRoles } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class UserCompany extends BaseModel {
  static tableName = 'user_companies';

  user_id: string;
  company_id: string;
  role: UserRoles;
  is_active: boolean;
  invited_by?: string;
  joined_at: Date;

  // Relations
  user: any;
  company: any;
  inviter: any;

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./user.model').User,
        join: {
          from: 'user_companies.user_id',
          to: 'users.id',
        },
      },
      company: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./company.model').Company,
        join: {
          from: 'user_companies.company_id',
          to: 'companies.id',
        },
      },
      inviter: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./user.model').User,
        join: {
          from: 'user_companies.invited_by',
          to: 'users.id',
        },
      },
    };
  }
}

export type UserCompanyModelType = ModelObject<UserCompany>;
