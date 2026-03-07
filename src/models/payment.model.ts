import { ModelObject } from 'objection';

import BaseModel from './base.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import { PaymentStatus } from '@/shared/utils/subscription.type';

export class Payment extends BaseModel {
  static tableName = 'payments';

  company_id: string;
  amount: number;
  currency: string;
  payment_method: string; // 'card', 'paypal', 'paystack'
  payment_method_details: Record<string, any>; // Stores card last4, paypal email etc
  status: PaymentStatus;
  invoice_id: string;
  subscription_id?: string;
  failure_reason?: string;
  retry_count: number = 0;

  static get relationMappings() {
    return {
      company: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./company.model').Company,
        join: {
          from: 'payments.company_id',
          to: 'companies.id',
        },
      },
    };
  }
}
export type PaymentModelType = ModelObject<Payment>;
