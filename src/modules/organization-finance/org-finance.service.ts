import { inject, injectable } from 'tsyringe';

import { OrgFinanceRepository } from '@/repositories/org-finance.repository';
import { OrgFinancePaymentRepository } from '@/repositories/org-finance-payment.repository';
import HttpError from '@/shared/utils/errorHandler';
import { OrgFinanceDTO } from './org-finance.dto';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory } from '@/shared/enums';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

@injectable()
export class OrgFinanceService {
  constructor(
    @inject(OrgFinanceRepository) private orgFinanceRepository: OrgFinanceRepository,
    @inject(OrgFinancePaymentRepository) private orgFinancePaymentRepository: OrgFinancePaymentRepository,
    @inject(Cloudinary) private cloudinary: Cloudinary,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  public async getAllOrgFinance(page: number = 1, pageSize: number = 10, companyId?: string) {
    try {
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

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
      const paymentHistoryRaw = await this.orgFinancePaymentRepository.getPaymentsByOrgFinanceId(id);
      const paymentHistory = paymentHistoryRaw.map((payment: any) => ({
        ...payment,
        payment_proof_url: payment.payment_proof_url || null,
      }));

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

  public async createOrgFinance(orgFinance: OrgFinanceDTO, user: any) {
    try {
      // Convert date string to Date object if it's a string and hardcode amount_paid to 0
      //check if the outstanding balance is greater than the total project cost
      if (orgFinance.outstanding_balance > orgFinance.total_project_cost) {
        throw new HttpError('Outstanding balance cannot be greater than total project cost', 400);
      }

      const orgFinanceData = {
        ...orgFinance,
        amount_paid: '0', // Hardcode amount_paid to 0
        outstanding_balance: orgFinance.total_project_cost, // Set outstanding balance to total project cost
        next_payment_due_date: typeof orgFinance.next_payment_due_date === 'string' ? new Date(orgFinance.next_payment_due_date) : orgFinance.next_payment_due_date,
      };

      const createdOrgFinance = await this.orgFinanceRepository.createOrgFinance(orgFinanceData);

      // Log org finance creation activity only if user is provided
      if (user && user.id) {
        this.auditTrailService.createEvent(
          AUDIT_TRAIL_ACTION.ORG_FINANCE_CREATED,
          {
            user_id: user.id,
            company_id: user.company_id,
            description: 'Organization finance record created',
            entity_description: `${user.name} created organization finance record`,
            entity_id: createdOrgFinance.id,
          },
          '',
        );
      }

      return createdOrgFinance;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to create org_finance record', error.statusCode || 500);
    }
  }
  public async searchOrgFinance(query: string, companyId?: string, page: number = 1, pageSize: number = 10) {
    try {
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

      return await this.orgFinanceRepository.searchOrgFinance(query, companyId, page, pageSize);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to search org_finance records', error.statusCode || 500);
    }
  }

  public async updateOrgFinance(id: string, updateData: Partial<OrgFinanceDTO>, user: any) {
    try {
      // Convert date string to Date object if it's a string
      const updateDataWithDate = {
        ...updateData,
        ...(updateData.next_payment_due_date && {
          next_payment_due_date: typeof updateData.next_payment_due_date === 'string' ? new Date(updateData.next_payment_due_date) : updateData.next_payment_due_date,
        }),
      };

      const updatedOrgFinance = await this.orgFinanceRepository.updateOrgFinance(id, updateDataWithDate);
      if (!updatedOrgFinance) {
        throw new HttpError('OrgFinance not found', 404);
      }

      // Log org finance update activity only if user is provided
      if (user && user.id) {
        this.auditTrailService.createEvent(
          AUDIT_TRAIL_ACTION.ORG_FINANCE_UPDATED,
          {
            user_id: user.id,
            company_id: user.company_id,
            description: 'Organization finance record updated',
            entity_description: `${user.name} updated organization finance record`,
            entity_id: id,
          },
          '',
        );
      }

      return updatedOrgFinance;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update org_finance record', error.statusCode || 500);
    }
  }
  public async markAsPaid(id: string, amountPaid: string, paymentProofFile?: any, user?: any) {
    try {
      let paymentProofUrl: string | undefined;

      // Upload payment proof if provided
      if (paymentProofFile) {
        let dataUrl: string;

        // Check if it's a base64 data URL string (new format from frontend)
        if (typeof paymentProofFile === 'string' && paymentProofFile.startsWith('data:')) {
          dataUrl = paymentProofFile;
        }
        // Check if it's a file buffer object (old format)
        else if (paymentProofFile.buffer && paymentProofFile.mimetype) {
          const base64Data = paymentProofFile.buffer.toString('base64');
          dataUrl = `data:${paymentProofFile.mimetype};base64,${base64Data}`;
        }
        // If neither format, throw error
        else {
          throw new HttpError('Invalid payment proof format', 400);
        }

        const uploadResult = await this.cloudinary.upload(DocumentsDirectory.PAYMENT_PROOF, dataUrl, `${id}-${Date.now()}`);

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

      // Log payment activity if user is provided
      if (user) {
        this.auditTrailService.createEvent(
          AUDIT_TRAIL_ACTION.ORG_FINANCE_MARKED_PAID,
          {
            user_id: user.id,
            company_id: user.company_id,
            description: 'Organization finance marked as paid',
            entity_description: `${user.name} marked organization finance as paid with amount ${amountPaid}`,
            entity_id: id,
          },
          '',
        );
      }

      // Get the updated payment history with payment proof URLs
      const paymentHistoryRaw = await this.orgFinancePaymentRepository.getPaymentsByOrgFinanceId(id);
      const paymentHistory = paymentHistoryRaw.map((payment: any) => ({
        ...payment,
        payment_proof_url: payment.payment_proof_url || null,
      }));

      return {
        ...updatedOrgFinance,
        paymentHistory,
        lastPaymentDate: paymentHistory.length > 0 ? paymentHistory[0].payment_date : null,
      };
    } catch (error: any) {
      // Handle overpayment error specifically
      if (error.message && error.message.includes('cannot exceed outstanding balance')) {
        throw new HttpError(error.message, 400);
      }
      throw new HttpError(error.message || 'Failed to mark org_finance as paid', error.statusCode || 500);
    }
  }
}
