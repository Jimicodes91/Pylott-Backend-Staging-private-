import { ModelObject } from 'objection';

import BaseModel from './base.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';

export class Company extends BaseModel {
  static tableName = 'companies';

  name: string;
  industry_type: string;
  size: string;
  country: string;
  address: string;
  city: string;
  postal_code?: string;
  admin_id?: string;
  consultant_id?: string[];
  client_id?: string;
  is_active?: boolean;
  subscription_status?: string;
  subscription_expiry_date?: Date;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type CompanyModelType = ModelObject<Company>;
