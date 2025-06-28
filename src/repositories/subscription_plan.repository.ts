// subscription-plan.repository.ts
import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { CreateSubscriptionPlanInput, SubscriptionPlan, SubscriptionPlanDetails, UpdateSubscriptionPlanInput } from '@/shared/utils/subscription.type';
import { SubscriptionPlanModelType, SubscriptionPlanModel } from '@/models/subscription_plan.model';

@injectable()
export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlanModelType, SubscriptionPlanModel> {
  constructor() {
    super(SubscriptionPlanModel);
  }

  async getAllPlans(): Promise<SubscriptionPlanDetails[]> {
    try {
      const result = await this.model.query().where('is_active', true);
      return result;
    } catch (error) {
      console.log(`ERROR GETTING SUBSCRIPTION PLANS ${error}`);
    }
  }

  async getPlanByName(name: SubscriptionPlan): Promise<SubscriptionPlanDetails | undefined> {
    return this.model.query().where('name', name).first();
  }

  async createPlan(data: CreateSubscriptionPlanInput): Promise<SubscriptionPlanDetails> {
    return this.model.query().insert(data);
  }

  async updatePlan(name: SubscriptionPlan, data: UpdateSubscriptionPlanInput): Promise<SubscriptionPlanDetails> {
    await this.model.query().where('name', name).update(data);
    return this.getPlanByName(name) as Promise<SubscriptionPlanDetails>;
  }

  async deletePlan(name: SubscriptionPlan): Promise<void> {
    await this.model.query().where('name', name).delete();
  }

  // Get all active plans
  public async getAllActivePlans() {
    try {
      return await this.model.query().where('is_active', true).orderBy('price', 'asc');
    } catch (error) {
      console.error('Error fetching active plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  // Validate plan exists and is active
  public async validatePlan(planName: SubscriptionPlan): Promise<boolean> {
    try {
      const plan = await this.getPlanByName(planName);
      return !!plan;
    } catch (error) {
      console.error('Error validating plan:', error);
      return false;
    }
  }
}
