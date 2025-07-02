import { inject, injectable } from 'tsyringe';

import { OrgFinanceRepository } from '@/repositories/org-finance.repository';
import { OrgFinancePaymentRepository } from '@/repositories/org-finance-payment.repository';
import HttpError from '@/shared/utils/errorHandler';
import { OrgFinanceDTO } from './org-finance.dto';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { DocumentsDirectory } from '@/shared/enums';

@injectable()
export class OrgFinanceService {
  constructor(
    @inject(OrgFinanceRepository) private orgFinanceRepository: OrgFinanceRepository,
    @inject(OrgFinancePaymentRepository) private orgFinancePaymentRepository: OrgFinancePaymentRepository,
    @inject(Cloudinary) private cloudinary: Cloudinary,
  ) {}

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

      // Get all payment records for this org_finance
      const paymentHistory = await this.orgFinancePaymentRepository.getPaymentsByOrgFinanceId(id);

      // Get the last payment date
      const lastPaymentDate = paymentHistory.length > 0 ? paymentHistory[0].payment_date : null;

      return {
        ...orgFinance,
        paymentHistory,
        lastPaymentDate,
      };
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

  public async updateOrgFinance(id: string, updateData: Partial<OrgFinanceDTO>) {
    try {
      const updatedOrgFinance = await this.orgFinanceRepository.updateOrgFinance(id, updateData);
      if (!updatedOrgFinance) {
        throw new HttpError('OrgFinance not found', 404);
      }
      return updatedOrgFinance;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update org_finance record', error.statusCode || 500);
    }
  }
  public async markAsPaid(id: string, amountPaid: string, paymentProofFile?: any) {
    try {
      let paymentProofUrl: string | undefined;

      // Upload payment proof if provided
      if (paymentProofFile) {
        const base64Data = paymentProofFile.buffer.toString('base64');
        const uploadResult = await this.cloudinary.upload(DocumentsDirectory.PAYMENT_PROOF, `data:${paymentProofFile.mimetype};base64,${base64Data}`, `${id}-${Date.now()}`);

        if (!uploadResult.status || !uploadResult.data) {
          throw new HttpError('Failed to upload payment proof', 500);
        }
        paymentProofUrl = uploadResult.data;
      }

      // Mark as paid - this will create a new payment record and update the main record
      const updatedOrgFinance = await this.orgFinanceRepository.markAsPaid(id, amountPaid, paymentProofUrl);

      if (!updatedOrgFinance) {
        throw new HttpError('OrgFinance not found', 404);
      }

      // Get the updated payment history
      const paymentHistory = await this.orgFinancePaymentRepository.getPaymentsByOrgFinanceId(id);

      return {
        ...updatedOrgFinance,
        paymentHistory,
      };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to mark org_finance as paid', error.statusCode || 500);
    }
  }
}
