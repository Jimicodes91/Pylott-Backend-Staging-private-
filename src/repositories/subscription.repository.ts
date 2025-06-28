import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { Subscription, SubscriptionModelType } from '@/models/subscription.model';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';
import { SubscriptionPlanModel } from '@/models/subscription_plan.model';

@injectable()
export class SubscriptionRepository extends BaseRepository<SubscriptionModelType, Subscription> {
  constructor() {
    super(Subscription);
  }

  public async getActiveSubscription(companyId: string) {
    return this.model.query().where('company_id', companyId).whereIn('status', ['active', 'past_due']).first();
  }

  public async getUpcomingRenewals(days: number = 7) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return this.model.query().where('current_period_end', '<=', date).where('status', 'active').where('cancel_at_period_end', false);
  }

  public async cancelAllExpiredSubscriptions() {
    const date = new Date();
    return this.model
      .query()
      .where('current_period_end', '<=', date)
      .where('cancel_at_period_end', true)
      .patch({
        status: SubscriptionStatus.CANCELLED,
        updated_at: new Date() as any,
      });
  }
  // Add these to SubscriptionRepository if needed
  // public async createSubscription(subscriptionData: { companyId: string; plan: any; status?: string; current_period_start: Date; current_period_end: Date }) {
  //   return this.create({
  //     ...subscriptionData,
  //     status: SubscriptionStatus.ACTIVE,
  //     cancel_at_period_end: false,
  //   });
  // }

  public async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
    return this.update({ id: subscriptionId }, { status });
  }
  public async getTotalSubscriptions(filters?: { status?: SubscriptionStatus }): Promise<number> {
    let query = this.model.query().whereNull('deleted_at'); // if you have soft deletes

    if (filters?.status) {
      query = query.where('status', filters.status);
    }

    const result = await query.count();
    const count = Number(result[0]['count(*)']); // or use Object.values(result[0])[0]
    return count || 0;
  }

  // Get subscription by company ID with plan details
  public async getSubscriptionByCompanyId(companyId: string) {
    try {
      const subscription = await this.model.query().where('company_id', companyId).withGraphJoined('company').first();

      if (!subscription) {
        return null;
      }

      // Get plan details separately to avoid circular dependency issues
      const planDetails = await SubscriptionPlanModel.query().where('name', subscription.plan).first();

      return {
        ...subscription,
        planDetails,
      };
    } catch (error) {
      console.error('Error fetching subscription by company ID:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  // Get active subscription by company ID
  public async getActiveSubscriptionByCompanyId(companyId: string) {
    try {
      const subscription = await this.model.query().where('company_id', companyId).where('status', 'active').withGraphJoined('company').first();

      if (!subscription) {
        return null;
      }

      const planDetails = await SubscriptionPlanModel.query().where('name', subscription.plan).first();

      return {
        ...subscription,
        planDetails,
      };
    } catch (error) {
      console.error('Error fetching active subscription:', error);
      throw new Error('Failed to fetch active subscription');
    }
  }

  // Create a new subscription
  public async createSubscription(subscriptionData: any) {
    try {
      return await this.model.query().insert(subscriptionData);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Update existing subscription
  public async updateSubscription(subscriptionId: string, updateData: any) {
    try {
      return await this.model.query().where('id', subscriptionId).update(updateData).returning('*').first();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  // Cancel subscription (set to cancel at period end)
  public async cancelSubscription(subscriptionId: string) {
    try {
      return await this.model
        .query()
        .where('id', subscriptionId)
        .update({
          cancel_at_period_end: true,
          status: SubscriptionStatus.CANCELLED,
          updated_at: new Date() as any,
        })
        .returning('*')
        .first();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Check if company has existing subscription
  public async hasExistingSubscription(companyId: string) {
    try {
      const subscription = await this.model.query().where('company_id', companyId).whereIn('status', ['active', 'trialing', 'past_due']).first();

      return !!subscription;
    } catch (error) {
      console.error('Error checking existing subscription:', error);
      throw new Error('Failed to check existing subscription');
    }
  }
}
