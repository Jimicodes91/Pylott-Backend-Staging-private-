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
  BASIC = 'basic',
  ELITE = 'elite',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'exprired',
}
