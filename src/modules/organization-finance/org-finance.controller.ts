import { Response, Request } from 'express';
import { injectable, inject } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { OrgFinanceService } from './org-finance.service';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class OrgFinanceController {
  constructor(@inject(OrgFinanceService) private readonly orgFinanceService: OrgFinanceService) {}

  public getAllOrgFinance = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const companyId = (req.query.companyId as string) || undefined;

      const result = await this.orgFinanceService.getAllOrgFinance(page, pageSize, companyId);

      return successResponse(res, 'Org Finance records retrieved successfully', {
        org_finance: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public getOrgFinanceById = async (req: Request, res: Response) => {
    try {
      const orgFinance = await this.orgFinanceService.getOrgFinanceById(req.params.id);
      return successResponse(res, 'Org Finance record retrieved successfully', orgFinance);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public createOrgFinance = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const orgFinance = await this.orgFinanceService.createOrgFinance(req.body, user);
      return successResponse(res, 'Org Finance record created successfully', orgFinance, 201);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
  public searchOrgFinance = async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      const companyId = (req.query.companyId as string) || undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await this.orgFinanceService.searchOrgFinance(query, companyId, page, pageSize);

      return successResponse(res, 'Org Finance records retrieved successfully', {
        org_finance: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public updateOrgFinance = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const updatedOrgFinance = await this.orgFinanceService.updateOrgFinance(req.params.id, req.body, user);
      return successResponse(res, 'Org Finance record updated successfully', updatedOrgFinance);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public markAsPaid = async (req: JwtPayload, res: Response) => {
    try {
      const { amount_paid } = req.body;
      const paymentProof = req.file; // From multer
      const user = (req as any).user;

      if (!amount_paid) {
        return errorResponse(res, 'error amount is required');
      }

      const updatedOrgFinance = await this.orgFinanceService.markAsPaid(req.params.id, amount_paid, paymentProof, user);

      return successResponse(res, 'Org Finance marked as paid successfully', updatedOrgFinance);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
