import { Response, Request } from 'express';
import { injectable, inject } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { OrgFinanceService } from './org-finance.service';

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
      return errorResponse(res, 'GET_ORG_FINANCE_ERROR', error.message, error.statusCode || 500);
    }
  };

  public getOrgFinanceById = async (req: Request, res: Response) => {
    try {
      const orgFinance = await this.orgFinanceService.getOrgFinanceById(req.params.id);
      return successResponse(res, 'Org Finance record retrieved successfully', orgFinance);
    } catch (error: any) {
      return errorResponse(res, 'GET_ORG_FINANCE_ERROR', error.message, error.statusCode || 500);
    }
  };

  public createOrgFinance = async (req: Request, res: Response) => {
    try {
      const orgFinance = await this.orgFinanceService.createOrgFinance(req.body);
      return successResponse(res, 'Org Finance record created successfully', orgFinance, 201);
    } catch (error: any) {
      return errorResponse(res, 'CREATE_ORG_FINANCE_ERROR', error.message, error.statusCode || 500);
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
      return errorResponse(res, 'SEARCH_ORG_FINANCE_ERROR', error.message, error.statusCode || 500);
    }
  };
}
