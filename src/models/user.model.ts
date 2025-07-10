import { ModelObject } from 'objection';

import { UserRoles } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Company } from './company.model';
import { UserCompany } from './user_company.model';

export class User extends BaseModel {
  static tableName = 'users';

  email: string;
  pfp?: string;
  password: string;
  name?: string;
  phone_number?: string;
  role?: UserRoles;
  company_id?: string;
  is_blocked?: boolean;
  is_verified?: boolean;
  timezone?: string;
  language?: string;
  currency?: string;
  is_active?: boolean;
  last_login?: Date;
  verification_token?: string;
  token_expires?: number;
  googleId?: string;
  refresh_token?: string; // Add this to your User model
  refresh_token_expires?: number; // Optional: Add expiry for refresh tokens
  password_setup_token?: string;
  login_count?: number;
  password_setup_token_expires?: number;

  company: Company;
  userCompanies: UserCompany[];

  static relationMappings = (): ModelsRelationMapping => ({
    company: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: 'users.company_id',
        to: 'companies.id',
      },
    },
    userCompanies: {
      relation: BaseModel.HasManyRelation,
      modelClass: UserCompany,
      join: {
        from: 'users.id',
        to: 'user_companies.user_id',
      },
    },
  });
}

export type UserModelType = ModelObject<User>;
