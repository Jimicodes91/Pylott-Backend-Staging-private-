import { injectable } from 'tsyringe';

import { Company, CompanyModelType } from '@/models';
import BaseRepository from './base.repository';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';
import { CompanyFilterOptions } from '@/shared/interface/company';

@injectable()
export class CompanyRepository extends BaseRepository<CompanyModelType, Company> {
  constructor() {
    super(Company);
  }

  // Fetch all companies with sorting and filtering
  public async getAllCompanies(filters: CompanyFilterOptions = {}, sortBy: string = 'created_at', order: 'asc' | 'desc' = 'desc') {
    try {
      let query = this.model.query().whereNull('deleted_at');

      // Apply filters
      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.subscription_status) {
        query = query.where('subscription_status', filters.subscription_status);
      }

      // Apply search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.where((builder) => {
          builder
            .whereRaw('LOWER(name) LIKE ?', [`%${searchTerm}%`])
            .orWhereRaw('LOWER(industry_type) LIKE ?', [`%${searchTerm}%`])
            .orWhereRaw('LOWER(city) LIKE ?', [`%${searchTerm}%`]);
        });
      }

      // Set default pagination if not provided
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;

      if (page < 1) throw new Error('Page must be greater than 0');
      if (pageSize < 1 || pageSize > 100) throw new Error('Page size must be between 1 and 100');

      const results = await query.orderBy(filters.sortBy || sortBy, filters.order || order).page(page - 1, pageSize);

      return {
        data: results.results,
        pagination: {
          total: results.total,
          page,
          pageSize,
          totalPages: Math.ceil(results.total / pageSize),
          hasNextPage: page * pageSize < results.total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  public async getCompanyNameById(companyId: string) {
    return this.model.query().select('name').where({ id: companyId }).first();
  }

  // Update company status
  public async updateCompanyStatus(companyId: string, subscription_status: SubscriptionStatus) {
    return this.model.query().where({ id: companyId }).update({ subscription_status });
  }
  public async getTotalCompanies(filters?: { status?: string; subscription_status?: SubscriptionStatus }): Promise<number> {
    let query = this.model.query().whereNull('deleted_at');

    if (filters?.status) {
      query = query.where('status', filters.status);
    }

    if (filters?.subscription_status) {
      query = query.where('subscription_status', filters.subscription_status);
    }

    const result = await query.count(); // returns array
    const count = Number(result[0]['count(*)']); // correct key
    return count || 0;
  }
}
