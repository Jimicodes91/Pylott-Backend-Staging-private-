import { Model, ModelObject } from 'objection';

import BaseModel from './base.model';
import { BillingCycle, PaymentMethod, SubscriptionPlan, SubscriptionStatus } from '@/shared/utils/subscription.type';
import { User } from './user.model';

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
  //new fields
  subscription_status?: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expiry_date?: Date;
  billing_cycle?: BillingCycle;
  default_payment_method?: PaymentMethod;
  grace_period_end_date?: Date;
  billing_email?: string;

  //static relationMappings = (): ModelsRelationMapping => ({});
  static get relationMappings() {
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'companies.id',
          to: 'users.company_id',
        },
      },
    };
  }
}

export type CompanyModelType = ModelObject<Company>;
