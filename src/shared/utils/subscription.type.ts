export type PaymentMethod = 'credit_card' | 'paypal' | 'stripe';

export type BillingCycle = 'monthly' | 'quarterly' | 'annually';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  ADVANCED = 'advanced',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'exprired',
}

// In subscription.type.ts or a new file like subscription-plan.type.ts
export interface SubscriptionPlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface SubscriptionPlanDetails {
  id: string;
  name: SubscriptionPlan;
  display_name: string;
  price: number;
  price_per_seat: boolean;
  currency: string;
  features: SubscriptionPlanFeature[];
  is_active: boolean;
}

export type CreateSubscriptionPlanInput = Omit<SubscriptionPlanDetails, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSubscriptionPlanInput = Partial<CreateSubscriptionPlanInput>;
