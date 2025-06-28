// models/subscription-plan.model.ts
import { ModelObject } from 'objection';
import BaseModel from './base.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import { SubscriptionPlan } from '@/shared/utils/subscription.type';
import { Subscription } from './subscription.model';

export class SubscriptionPlanModel extends BaseModel {
  static tableName = 'subscription_plans';

  name: SubscriptionPlan;
  display_name: string;
  price: number;
  price_per_seat: boolean;
  currency: string;
  features: any; // JSON column for features array
  is_active: boolean;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'display_name', 'price'],
      properties: {
        name: { type: 'string', enum: Object.values(SubscriptionPlan) },
        display_name: { type: 'string' },
        price: { type: 'number' },
        price_per_seat: { type: 'boolean' },
        currency: { type: 'string', default: 'USD' },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              enabled: { type: 'boolean' },
            },
          },
        },
        is_active: { type: 'boolean', default: true },
      },
    };
  }

  static relationMappings = (): ModelsRelationMapping => ({
    subscriptions: {
      relation: BaseModel.HasManyRelation,
      modelClass: Subscription, // Circular dependency, use string
      join: {
        from: 'subscription_plans.name',
        to: 'subscriptions.plan',
      },
    },
  });
}

export type SubscriptionPlanModelType = ModelObject<SubscriptionPlanModel>;
