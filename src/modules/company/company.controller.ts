import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { CompanyService } from './services/company.service';

@injectable()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  public createCompany = async (req: Request, res: Response) => {
    //console.log(req);
    try {
      const adminId = (req as any).user.id;
      const role = (req as any).user.role;
      const companyData = req.body;

      if (!adminId) {
        return errorResponse(res, 'Admin ID is required');
      }

      const company = await this.companyService.createCompany(companyData, adminId, role);

      return successResponse(res, 'Company created successfully', company);
    } catch (error: any) {
      console.log(error);
      return errorResponse(res, 'CREATE_COMPANY_ERROR', error.message, error.statusCode || 500);
    }
  };
}
