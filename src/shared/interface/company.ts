import { SubscriptionStatus } from '../utils/subscription.type';

export interface CompanySignupData {
  name: string;
  industry_type: string;
  size: string;
  country: string;
  address: string;
  city: string;
  postal_code?: string;
  admin_id?: string;
  is_active?: boolean;
}

export interface CompanyFilterOptions {
  status?: string;
  subscription_status?: SubscriptionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
