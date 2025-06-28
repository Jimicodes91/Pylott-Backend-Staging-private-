import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { PaymentModelType, Payment } from '@/models/payment.model';
import { PaymentStatus } from '@/shared/utils/subscription.type';

@injectable()
export class PaymentRepository extends BaseRepository<PaymentModelType, Payment> {
  constructor() {
    super(Payment);
  }

  public async getRecentPayments(companyId: string, months: number = 6, limit: number = 10) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);

    return this.model.query().where('company_id', companyId).where('created_at', '>=', date).orderBy('created_at', 'desc').limit(limit);
  }

  public async getByInvoiceId(invoiceId: string) {
    return this.findOne({ invoice_id: invoiceId });
  }

  public async getFailedPayments(companyId: string) {
    return this.findMany({
      company_id: companyId,
      status: PaymentStatus.FAILED,
    });
  }
  // Add these to PaymentRepository if needed
  public async getSuccessfulPayments(companyId: string) {
    return this.findMany({
      company_id: companyId,
      status: PaymentStatus.COMPLETED,
    });
  }

  public async createPayment(paymentData: { companyId: string; amount: number; currency?: string; paymentMethod: string; status?: string; invoice_id?: string; subscription_id?: string }) {
    return this.create({
      ...paymentData,
      currency: paymentData.currency || 'USD',
      status: PaymentStatus.PENDING,
      invoice_id: paymentData.invoice_id || `inv_${Date.now()}`,
      payment_method_details: {},
    });
  }

  // Add to your PaymentRepository class

  public async getInvoicesForCompany(companyId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    return {
      data: await this.model.query().where('company_id', companyId).orderBy('created_at', 'desc').offset(offset).limit(limit),
      pagination: {
        page,
        limit,
        total: await this.count({ company_id: companyId }),
      },
    };
  }

  public async getInvoiceById(invoiceId: string) {
    return this.model.query().where('invoice_id', invoiceId).withGraphFetched('[company, subscription]').first();
  }
}
