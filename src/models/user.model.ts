import { ModelObject } from 'objection';

import { UserRoles } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class User extends BaseModel {
  static tableName = 'users';

  email: string;
  pfp?: string;
  password: string;
  name?: string;
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
  password_setup_token?: string;
  password_setup_token_expires?: number;

  static relationMappings = (): ModelsRelationMapping => ({});
  _id: any;
}

export type UserModelType = ModelObject<User>;
