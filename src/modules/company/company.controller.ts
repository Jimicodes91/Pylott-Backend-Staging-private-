import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { CompanyService } from './services/company.service';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  public createCompany = async (req: Request, res: Response) => {
    //console.log(req);
    try {
      const adminId = req.params.id;
      const companyData = req.body;

      if (!adminId) {
        return errorResponse(res, 'Admin ID is required');
      }

      const company = await this.companyService.createCompany(companyData, adminId);

      return successResponse(res, 'Company created successfully', company);
    } catch (error: any) {
      console.log(error);
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public getCompanySubscription = async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;

      if (!companyId) {
        return errorResponse(res, 'Company ID is required');
      }

      const subscriptionData = await this.companyService.getCompanySubscription(companyId);

      return successResponse(res, 'Company subscription retrieved successfully', subscriptionData);
    } catch (error: any) {
      console.error('GET_COMPANY_SUBSCRIPTION_ERROR:', error);
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
