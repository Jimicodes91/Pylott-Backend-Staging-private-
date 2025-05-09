import { inject, injectable } from 'tsyringe';

import { OrgFinanceRepository } from '@/repositories/org-finance.repository';
import HttpError from '@/shared/utils/errorHandler';
import { OrgFinanceDTO } from './org-finance.dto';

@injectable()
export class OrgFinanceService {
  constructor(@inject(OrgFinanceRepository) private orgFinanceRepository: OrgFinanceRepository) {}

  public async getAllOrgFinance(page: number = 1, pageSize: number = 10, companyId: string) {
    try {
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.orgFinanceRepository.getAllOrganizationFinanceRecord(page, pageSize, companyId);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch org_finance records', error.statusCode || 500);
    }
  }
  public async getOrgFinanceById(id: string) {
    try {
      const orgFinance = await this.orgFinanceRepository.getOrgFinanceById(id);
      if (!orgFinance) {
        throw new HttpError('OrgFinance not found', 404);
      }
      return orgFinance;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch org_finance record', error.statusCode || 500);
    }
  }
  public async createOrgFinance(orgFinance: OrgFinanceDTO) {
    try {
      const createdOrgFinance = await this.orgFinanceRepository.createOrgFinance(orgFinance);
      return createdOrgFinance;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to create org_finance record', error.statusCode || 500);
    }
  }
  public async searchOrgFinance(query: string, companyId?: string, page: number = 1, pageSize: number = 10) {
    try {
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.orgFinanceRepository.searchOrgFinance(query, companyId, page, pageSize);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to search org_finance records', error.statusCode || 500);
    }
  }
}
