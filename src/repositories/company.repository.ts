import { injectable } from 'tsyringe';

import { Company, CompanyModelType } from '@/models';
import BaseRepository from './base.repository';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';

@injectable()
export class CompanyRepository extends BaseRepository<CompanyModelType, Company> {
  constructor() {
    super(Company);
  }

  // Fetch all companies with sorting and filtering
  public async getAllCompanies(filters: { status?: string; subscription_status?: SubscriptionStatus }, sortBy: string = 'created_at', order: 'asc' | 'desc' = 'desc') {
    let query = this.model.query().whereNull('deleted_at');

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.subscription_status) {
      query = query.where('subscription_status', filters.subscription_status);
    }

    return query.orderBy(sortBy, order);
  }

  public async getCompanyNameById(companyId: string) {
    return this.model.query().select('name').where({ id: companyId }).first();
  }

  // Update company status
  public async updateCompanyStatus(companyId: string, subscription_status: SubscriptionStatus) {
    return this.model.query().where({ id: companyId }).update({ subscription_status });
  }
}
