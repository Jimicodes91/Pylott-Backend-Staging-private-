import { ModelObject } from 'objection';

import { UserRoles } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';
import { Company } from './company.model';

export class UserCompany extends BaseModel {
  static tableName = 'user_companies';

  user_id: string;
  company_id: string;
  role: UserRoles;
  is_active: boolean;
  invited_by?: string;
  joined_at: Date;
  can_invite_clients?: boolean;
  can_approve_client_invites?: boolean;

  // Relations
  user: User;
  company: Company;
  inviter: User;

  static relationMappings = (): ModelsRelationMapping => ({
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'user_companies.user_id',
        to: 'users.id',
      },
    },
    company: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'user_companies.company_id',
        to: 'companies.id',
      },
    },
    inviter: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'user_companies.invited_by',
        to: 'users.id',
      },
    },
  });
}

export type UserCompanyModelType = ModelObject<UserCompany>;
