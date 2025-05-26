import { inject, injectable } from 'tsyringe';
import { SubscriptionRepository } from '@/repositories/subscription.repository';

import { CompanyRepository } from '@/repositories/company.repository';
import { UserRepository } from '@/repositories/user.repository';
import HttpError from '@/shared/utils/errorHandler';
import { SubscriptionPlan, SubscriptionStatus } from '@/shared/utils/subscription.type';
import { SubscriptionPlanRepository } from '@/repositories/subscription_plan.repository';

interface SubscribeCompanyData {
  plan: SubscriptionPlan;
  payment_method_id?: string;
}

@injectable()
export class SubscriptionService {
  constructor(
    @inject(SubscriptionRepository) private subscriptionRepository: SubscriptionRepository,
    @inject(SubscriptionPlanRepository) private subscriptionPlanRepository: SubscriptionPlanRepository,
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  public async subscribeCompany(companyId: string, subscriptionData: SubscribeCompanyData) {
    try {
      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

      if (!subscriptionData.plan) {
        throw new HttpError('Subscription plan is required', 400);
      }

      // Validate company exists
      const company = await this.companyRepository.getById(companyId);
      if (!company) {
        throw new HttpError('Company not found', 404);
      }

      // Validate subscription plan exists and is active
      const planDetails = await this.subscriptionPlanRepository.getPlanByName(subscriptionData.plan);
      if (!planDetails) {
        throw new HttpError('Invalid or inactive subscription plan', 400);
      }

      // Check if company already has an active subscription
      const hasExistingSubscription = await this.subscriptionRepository.hasExistingSubscription(companyId);
      if (hasExistingSubscription) {
        throw new HttpError('Company already has an active subscription', 409);
      }

      // Calculate subscription period (30 days from now)
      const currentDate = new Date();
      const periodStart = new Date(currentDate);
      const periodEnd = new Date(currentDate);
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Create subscription
      const newSubscription = await this.subscriptionRepository.createSubscription({
        company_id: companyId,
        plan: subscriptionData.plan,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        payment_method_id: subscriptionData.payment_method_id || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update company subscription status
      await this.companyRepository.updateCompanyStatus(companyId, SubscriptionStatus.ACTIVE);

      // Get active users count for pricing calculation
      const activeUsersCount = await this.userRepository.getActiveUserCountByCompanyId(companyId);

      // Calculate pricing
      let totalMonthlyPrice = planDetails.price;
      if (planDetails.price_per_seat) {
        totalMonthlyPrice = planDetails.price * activeUsersCount;
      }

      return {
        subscription: {
          id: newSubscription.id,
          company_id: newSubscription.company_id,
          plan: newSubscription.plan,
          status: newSubscription.status,
          current_period_start: newSubscription.current_period_start,
          current_period_end: newSubscription.current_period_end,
          cancel_at_period_end: newSubscription.cancel_at_period_end,
          payment_method_id: newSubscription.payment_method_id,
        },
        planDetails: {
          name: planDetails.name,
          display_name: planDetails.display_name,
          price: planDetails.price,
          price_per_seat: planDetails.price_per_seat,
          currency: planDetails.currency,
          features: planDetails.features,
        },
        pricing: {
          active_users_count: activeUsersCount,
          price_per_seat: planDetails.price,
          total_monthly_price: totalMonthlyPrice,
        },
        company: {
          id: company.id,
          name: company.name,
        },
      };
    } catch (error: any) {
      console.error('Error subscribing company:', error);
      throw new HttpError(error.message || 'Failed to subscribe company', error.statusCode || 500);
    }
  }

  public async getCompanySubscription(companyId: string) {
    try {
      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

      // Get the subscription with plan details
      const subscription = await this.subscriptionRepository.getActiveSubscriptionByCompanyId(companyId);

      if (!subscription) {
        throw new HttpError('No active subscription found for this company', 404);
      }

      // Get active users count for the company
      const activeUsersCount = await this.userRepository.getActiveUserCountByCompanyId(companyId);

      // Calculate pricing
      let totalMonthlyPrice = subscription.planDetails?.price || 0;

      if (subscription.planDetails?.price_per_seat) {
        totalMonthlyPrice = (subscription.planDetails.price || 0) * activeUsersCount;
      }

      return {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        planDetails: {
          name: subscription.planDetails?.name,
          display_name: subscription.planDetails?.display_name,
          price: subscription.planDetails?.price,
          price_per_seat: subscription.planDetails?.price_per_seat,
          currency: subscription.planDetails?.currency || 'USD',
          features: subscription.planDetails?.features,
          is_active: subscription.planDetails?.is_active,
        },
        usage: {
          active_users_count: activeUsersCount,
          price_per_seat: subscription.planDetails?.price || 0,
          total_monthly_price: totalMonthlyPrice,
        },
      };
    } catch (error: any) {
      console.error('Error getting company subscription:', error);
      throw new HttpError(error.message || 'Failed to get company subscription', error.statusCode || 500);
    }
  }

  public async cancelCompanySubscription(companyId: string) {
    try {
      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

      // Get current active subscription
      const subscription = await this.subscriptionRepository.getActiveSubscriptionByCompanyId(companyId);
      if (!subscription) {
        throw new HttpError('No active subscription found for this company', 404);
      }

      // Cancel the subscription (set to cancel at period end)
      const canceledSubscription = await this.subscriptionRepository.cancelSubscription(subscription.id);

      return {
        subscription: {
          id: canceledSubscription.id,
          plan: canceledSubscription.plan,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: canceledSubscription.current_period_end,
        },
        message: 'Subscription will be canceled at the end of the current billing period',
      };
    } catch (error: any) {
      console.error('Error canceling company subscription:', error);
      throw new HttpError(error.message || 'Failed to cancel company subscription', error.statusCode || 500);
    }
  }
}
