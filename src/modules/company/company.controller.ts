import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { CompanyService } from './services/company.service';

@injectable()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  create = async (req: Request, res: Response) => successResponse(res, 'Create company', {});

  public createCompany = async (req: Request, res: Response) => {
    try {
      const { adminId } = req.params;
      const companyData = req.body;

      if (!adminId) {
        return errorResponse(res, 'Admin ID is required');
      }

      const company = await this.companyService.createCompany(companyData, adminId);
      return successResponse(res, 'Company created successfully', company);
    } catch (error: any) {
      return errorResponse(res, 'CREATE_COMPANY_ERROR', error.message, error.statusCode || 500);
    }
  };
}
