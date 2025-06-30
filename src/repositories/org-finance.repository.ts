import { injectable } from 'tsyringe';

import { OrgFinance, OrgFinanceModelType } from '@/models/org-finance.model';
import BaseRepository from './base.repository';
import { OrgFinanceDTO } from '@/modules/organization-finance/org-finance.dto';

@injectable()
export class OrgFinanceRepository extends BaseRepository<OrgFinanceModelType, OrgFinance> {
  constructor() {
    super(OrgFinance);
  }

  // Fetch all org_finance records with sorting and filtering with from the same organizationId.
  public async getAllOrganizationFinanceRecord(page: number = 1, pageSize: number = 10, companyId: string) {
    try {
      const results = await this.model
        .query()
        .where({ organization_id: companyId })
        .page(page - 1, pageSize) // Objection.js uses 0-based page index
        .orderBy('created_at');

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
      console.error('Error fetching org_finance records:', error);
      throw new Error('Failed to fetch org_finance records');
    }
  }

  public async getOrgFinanceById(id: string) {
    return await this.model.query().where({ id }).first().skipUndefined();
  }

  public async createOrgFinance(orgFinance: OrgFinanceDTO) {
    return await this.model.query().insert(orgFinance);
  }

  public async searchOrgFinance(query: string, companyId?: string, page: number = 1, pageSize: number = 10) {
    try {
      //   const results = await this.model
      //     .query()
      //     .where({ organization_id: companyId })
      //     .where((builder) => {
      //       builder
      //         .where('client_name', 'ilike', `%${query}%`)
      //         .orWhere('project_title', 'ilike', `%${query}%`);
      //     })
      //     .page(page - 1, pageSize) // Objection.js uses 0-based page index
      //     .orderBy('created_at');
      const searchTerm = `%${query.toLowerCase()}%`;
      let queryBuilder = this.model.query().whereRaw('LOWER(client_name) LIKE ?', [searchTerm]).orWhereRaw('LOWER(project_title) LIKE ?', [searchTerm]);
      if (companyId) {
        queryBuilder = queryBuilder.where('organization_id', companyId);
      }
      const results = await queryBuilder.page(page - 1, pageSize).orderBy('created_at');

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
      console.error('Error fetching org_finance records:', error);
      throw new Error('Failed to fetch org_finance records');
    }
  }

  public async updateOrgFinance(id: string, updateData: Partial<OrgFinanceDTO>) {
    return await this.model.query().patchAndFetchById(id, updateData);
  }
  public async markAsPaid(id: string, amountPaid: string, paymentProofUrl?: string) {
    // First, get the current record to check outstanding balance
    const currentRecord = await this.model.query().where({ id }).first();

    if (!currentRecord) {
      throw new Error('Organization finance record not found');
    }

    // Convert string amounts to numbers for calculations
    const currentOutstandingBalance = parseFloat(currentRecord.outstanding_balance || '0');
    const currentAmountPaid = parseFloat(currentRecord.amount_paid || '0');
    const paymentAmount = parseFloat(amountPaid);

    // Check if there's an outstanding balance to pay
    if (currentOutstandingBalance <= 0) {
      throw new Error('No outstanding balance to pay');
    }

    // Calculate new outstanding balance and amount paid
    const newOutstandingBalance = Math.max(0, currentOutstandingBalance - paymentAmount);
    const newAmountPaid = currentAmountPaid + paymentAmount;

    // Determine if the payment is complete (outstanding balance is zero)
    const isPaymentComplete = newOutstandingBalance === 0;

    // Update the record
    return await this.model.query().patchAndFetchById(id, {
      has_paid: isPaymentComplete,
      payment_status: isPaymentComplete ? 'paid' : 'partial',
      amount_paid: newAmountPaid.toString(),
      outstanding_balance: newOutstandingBalance.toString(),
      payment_proof_url: paymentProofUrl,
      payment_date: new Date(),
    });
  }
}
