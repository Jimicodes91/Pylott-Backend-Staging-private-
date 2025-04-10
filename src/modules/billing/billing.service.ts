import { inject, injectable } from 'tsyringe';

import { CompanyRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import { SubscriptionRepository } from '@/repositories/subscription.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { SubscriptionPlan, SubscriptionStatus, PaymentStatus } from '@/shared/utils/subscription.type';

@injectable()
export class BillingService {
  constructor(
    @inject(PaymentRepository) private paymentRepo: PaymentRepository,
    @inject(SubscriptionRepository) private subscriptionRepo: SubscriptionRepository,
    @inject(CompanyRepository) private companyRepo: CompanyRepository,
  ) {}

  private PLANS = {
    [SubscriptionPlan.BASIC]: { price: 29, features: [] },
    [SubscriptionPlan.ELITE]: { price: 99, features: [] },
    [SubscriptionPlan.PREMIUM]: { price: 299, features: [] },
  };

  async getCompanyBillingOverview(companyId: string) {
    const [subscription, recentPayments] = await Promise.all([this.subscriptionRepo.getActiveSubscription(companyId), this.paymentRepo.getRecentPayments(companyId, 6)]);

    return {
      currentPlan: subscription?.plan,
      nextPaymentDue: subscription?.current_period_end,
      paymentMethods: [], // Will integrate with payment processor
      recentTransactions: recentPayments,
    };
  }

  async changeSubscriptionPlan(companyId: string, newPlan: SubscriptionPlan) {
    const subscription = await this.subscriptionRepo.getActiveSubscription(companyId);
    const company = await this.companyRepo.getById(companyId);

    if (!company) throw new HttpError('Company not found', 404);

    // Process payment
    const payment = await this.processPayment({
      companyId,
      amount: this.PLANS[newPlan].price,
      paymentMethod: 'card', // Default for upgrades
    });

    // Update subscription
    await this.subscriptionRepo.update(subscription.id as any, {
      plan: newPlan,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: new Date(),
      current_period_end: this.getNextBillingDate(),
    });

    return { success: true, payment };
  }

  async cancelSubscription(companyId: string) {
    const subscription = await this.subscriptionRepo.getActiveSubscription(companyId);

    await this.subscriptionRepo.update(subscription.id as any, {
      cancel_at_period_end: true,
      status: SubscriptionStatus.CANCELLED,
    });

    return {
      success: true,
      message: 'Subscription will cancel at period end',
      active_until: subscription.current_period_end,
    };
  }

  private async processPayment(paymentData: { companyId: string; amount: number; paymentMethod: string }) {
    // Integrate with PayStack/PayPal here
    // This is a mock implementation
    const payment = await this.paymentRepo.create({
      ...paymentData,
      status: PaymentStatus.COMPLETED,
      invoice_id: `inv_${Date.now()}`,
      payment_method_details: {},
    });

    return payment;
  }

  private getNextBillingDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  async addPaymentMethod(
    companyId: string,
    paymentMethodData: {
      type: 'card' | 'paypal' | 'stripe';
      details: Record<string, any>;
    },
  ) {
    // 1. Tokenize with payment processor (Stripe, Paystack, etc.)
    // 2. Store the token/reference in your database

    // For now, we'll mock this
    const paymentMethod = {
      id: `pm_${Date.now()}`,
      company_id: companyId,
      ...paymentMethodData,
      created_at: new Date(),
      is_default: false,
    };

    // Set as default if no other methods exist
    const existingMethods = await this.getPaymentMethods(companyId);
    if (existingMethods.length === 0) {
      paymentMethod.is_default = true;
      await this.companyRepo.update({ id: companyId }, { default_payment_method: paymentMethod.id as any });
    }

    return paymentMethod;
  }

  async getPaymentMethods(companyId: string) {
    // Mock implementation:
    return [
      {
        id: 'pm_123',
        type: 'card',
        last4: '4242',
        companyId: companyId,
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
      },
    ];
  }

  async getInvoices(companyId: string) {
    return this.paymentRepo.findMany({
      company_id: companyId,
    });
  }

  async setDefaultPaymentMethod(companyId: string, paymentMethodId: string) {
    // Validate the payment method belongs to company
    const methods = await this.getPaymentMethods(companyId);
    const methodExists = methods.some((m) => m.id === paymentMethodId);

    if (!methodExists) {
      throw new HttpError('Payment method not found', 404);
    }

    await this.companyRepo.update({ id: companyId }, { default_payment_method: paymentMethodId as any });

    return { success: true };
  }
}
