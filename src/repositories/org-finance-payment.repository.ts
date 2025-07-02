import { injectable } from 'tsyringe';
import { OrgFinancePayment, OrgFinancePaymentModelType } from '@/models/org-finance-payment.model';
import BaseRepository from './base.repository';

@injectable()
export class OrgFinancePaymentRepository extends BaseRepository<OrgFinancePaymentModelType, OrgFinancePayment> {
  constructor() {
    super(OrgFinancePayment);
  }

  public async getPaymentsByOrgFinanceId(orgFinanceId: string) {
    try {
      return await this.model.query().where({ org_finance_id: orgFinanceId }).orderBy('payment_date', 'desc');
    } catch (error) {
      console.error('Error fetching org_finance payments:', error);
      throw new Error('Failed to fetch org_finance payments');
    }
  }

  public async createPayment(paymentData: { org_finance_id: string; amount_paid: string; payment_proof_url?: string; payment_date?: Date; notes?: string; payment_method?: string }) {
    try {
      return await this.model.query().insert(paymentData);
    } catch (error) {
      console.error('Error creating org_finance payment:', error);
      throw new Error('Failed to create org_finance payment');
    }
  }

  public async getTotalAmountPaid(orgFinanceId: string) {
    try {
      const result = await this.model.query().where({ org_finance_id: orgFinanceId }).sum('amount_paid as total').first();

      //total does not exist in the model declare it or something
      return result?.total || 0;
    } catch (error) {
      console.error('Error calculating total amount paid:', error);
      throw new Error('Failed to calculate total amount paid');
    }
  }
}
