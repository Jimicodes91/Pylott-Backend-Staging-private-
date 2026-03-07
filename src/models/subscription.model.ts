import { ModelObject } from 'objection';

import BaseModel from './base.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import { Payment } from './payment.model';
import { SubscriptionPlan, SubscriptionStatus } from '@/shared/utils/subscription.type';

export class Subscription extends BaseModel {
  static tableName = 'subscriptions';

  company_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  payment_method_id?: string;
  latest_invoice_id?: string;

  static get relationMappings() {
    return {
      company: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./company.model').Company,
        join: {
          from: 'subscriptions.company_id',
          to: 'companies.id',
        },
      },
      payments: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./payment.model').Payment,
        join: {
          from: 'subscriptions.id',
          to: 'payments.subscription_id',
        },
      },
    };
  }
}
export type SubscriptionModelType = ModelObject<Subscription>;
