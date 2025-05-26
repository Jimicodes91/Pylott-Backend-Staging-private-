// shared/interface/subscription.ts
import { SubscriptionPlan } from '@/shared/utils/subscription.type';

export interface SubscribeCompanyRequest {
  plan: SubscriptionPlan;
  payment_method_id?: string;
}

export interface SubscriptionResponse {
  subscription: {
    id: string;
    company_id: string;
    plan: SubscriptionPlan;
    status: string;
    current_period_start: Date;
    current_period_end: Date;
    cancel_at_period_end: boolean;
    payment_method_id?: string;
  };
  planDetails: {
    name: SubscriptionPlan;
    display_name: string;
    price: number;
    price_per_seat: boolean;
    currency: string;
    features: any[];
  };
  pricing: {
    active_users_count: number;
    price_per_seat: number;
    total_monthly_price: number;
  };
  company: {
    id: string;
    name: string;
  };
}

export interface CancelSubscriptionResponse {
  subscription: {
    id: string;
    plan: SubscriptionPlan;
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: Date;
  };
  message: string;
}
