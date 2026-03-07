import { Model, ModelObject } from 'objection';

import BaseModel from './base.model';
import { BillingCycle, PaymentMethod, SubscriptionPlan, SubscriptionStatus } from '@/shared/utils/subscription.type';
import { User } from './user.model';
import { UserCompany } from './user_company.model';

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
        modelClass: require('./user.model').User,
        join: {
          from: 'companies.id',
          to: 'users.company_id',
        },
      },
      userCompanies: {
        relation: Model.HasManyRelation,
        modelClass: require('./user_company.model').UserCompany,
        join: {
          from: 'companies.id',
          to: 'user_companies.company_id',
        },
      },
      subscription: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./subscription.model').Subscription,
        join: {
          from: 'companies.subscription_id',
          to: 'subscriptions.id',
        },
      },
    };
  }
}

export type CompanyModelType = ModelObject<Company>;
