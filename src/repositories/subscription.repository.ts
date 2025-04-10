import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { Subscription, SubscriptionModelType } from '@/models/subscription.model';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';

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
  public async createSubscription(subscriptionData: { companyId: string; plan: any; status?: string; current_period_start: Date; current_period_end: Date }) {
    return this.create({
      ...subscriptionData,
      status: SubscriptionStatus.ACTIVE,
      cancel_at_period_end: false,
    });
  }

  public async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
    return this.update({ id: subscriptionId }, { status });
  }
}
