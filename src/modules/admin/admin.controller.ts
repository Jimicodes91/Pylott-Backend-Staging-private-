import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { SysAdminService } from './admin.service';

@injectable()
export class SysAdminController {
  constructor(private readonly sysAdminService: SysAdminService) {}

  public getDashboardSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.sysAdminService.getDashboardSummary();
      return successResponse(res, 'Dashboard summary fetched successfully', summary);
    } catch (error: any) {
      return errorResponse(res, 'DASHBOARD_SUMMARY_ERROR', error.message, error.statusCode || 500);
    }
  };

  public getAllUsers = async (req: Request, res: Response) => {
    try {
      const allUsers: any = await this.sysAdminService.getTotalUsers();
      return successResponse(res, 'users fetched successfully', allUsers);
    } catch (error) {
      return errorResponse(res, 'DASHBOARD_SUMMARY_ERROR', error.message, error.statusCode || 500);
    }
  };
  public getActiveUsers = async (req: Request, res: Response) => {
    try {
      const allUsers = await this.sysAdminService.getActiveUsers();
      return successResponse(res, 'users fetched successfully', allUsers);
    } catch (error) {
      return errorResponse(res, 'DASHBOARD_SUMMARY_ERROR', error.message, error.statusCode || 500);
    }
  };
  public getAllCompanies = async (req: Request, res: Response) => {
    try {
      const { status, subscription_status } = req.query;
      const filters = {
        status: status as string,
        subscription_status: subscription_status as string,
      };
      const companies = await this.sysAdminService.getAllCompanies(filters);
      return successResponse(res, 'Companies fetched successfully', companies);
    } catch (error: any) {
      return errorResponse(res, 'GET_ALL_COMPANIES_ERROR', error.message, error.statusCode || 500);
    }
  };
  public getCompanyDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const company = await this.sysAdminService.getCompanyDetails(id);
      return successResponse(res, 'Company details fetched successfully', company);
    } catch (error: any) {
      return errorResponse(res, 'GET_COMPANY_DETAILS_ERROR', error.message, error.statusCode || 500);
    }
  };
  public updateCompanyStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { subscription_status } = req.body;
      const updatedCompany = await this.sysAdminService.updateCompanyStatus(id, subscription_status);
      return successResponse(res, 'Company status updated successfully', updatedCompany.toString);
    } catch (error: any) {
      return errorResponse(res, 'UPDATE_COMPANY_STATUS_ERROR', error.message, error.statusCode || 500);
    }
  };
  public subscribeCompany = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;
      const subscribedCompany = await this.sysAdminService.subscribeCompany(id, new Date(expiryDate));
      return successResponse(res, 'Company subscribed successfully', subscribedCompany as any);
    } catch (error: any) {
      return errorResponse(res, 'SUBSCRIBE_COMPANY_ERROR', error.message, error.statusCode || 500);
    }
  };
  // Cancel subscription
  public cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedCompany = await this.sysAdminService.cancelSubscription(id);
      return successResponse(res, 'Subscription canceled successfully', updatedCompany as any);
    } catch (error: any) {
      return errorResponse(res, 'CANCEL_SUBSCRIPTION_ERROR', error.message, error.statusCode || 500);
    }
  };
  // Renew subscription
  public renewSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;
      const renewedCompany = await this.sysAdminService.renewSubscription(id, new Date(expiryDate));
      return successResponse(res, 'Subscription renewed successfully', renewedCompany as any);
    } catch (error: any) {
      return errorResponse(res, 'RENEW_SUBSCRIPTION_ERROR', error.message, error.statusCode || 500);
    }
  };
  // Add a new SysAdmin
  public addSysAdmin = async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;

      const result = await this.sysAdminService.addSysAdmin(name, email);

      return successResponse(res, result.message, result);
    } catch (error: any) {
      return errorResponse(res, 'ADD_SYSADMIN_ERROR', error.message, error.statusCode || 500);
    }
  };

  // Deactivate a SysAdmin
  public deactivateSysAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deactivatedSysAdmin = await this.sysAdminService.deactivateSysAdmin(id);
      return successResponse(res, 'SysAdmin deactivated successfully', deactivatedSysAdmin as any);
    } catch (error: any) {
      return errorResponse(res, 'DEACTIVATE_SYSADMIN_ERROR', error.message, error.statusCode || 500);
    }
  };
}
