import { ModelObject } from 'objection';

import { UserRoles } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';
import { Company } from './company.model';

export class Invitation extends BaseModel {
  static tableName = 'invitations';

  email: string;
  role: UserRoles;
  company_id: string;
  invited_by: string;
  invitation_token: string;
  token_expires: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';

  // Relations
  company: Company;
  inviter: User;

  static relationMappings = (): ModelsRelationMapping => ({
    company: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'invitations.company_id',
        to: 'companies.id',
      },
    },
    inviter: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'invitations.invited_by',
        to: 'users.id',
      },
    },
  });
}

export type InvitationModelType = ModelObject<Invitation>;
