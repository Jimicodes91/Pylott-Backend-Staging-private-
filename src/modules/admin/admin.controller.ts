import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { SysAdminService, UserFilterOptions } from './admin.service';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';
import { CompanyFilterOptions } from '@/shared/interface/company';

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
      const { page, pageSize, search } = req.query;

      const filter: UserFilterOptions = {
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        search: search as string,
      };

      const allUsers = await this.sysAdminService.getTotalUsers(filter);
      return successResponse(res, 'Users fetched successfully', allUsers);
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
      const { status, subscription_status, search, page, pageSize, sortBy, order } = req.query;

      const filters: CompanyFilterOptions = {
        status: status as string,
        subscription_status: subscription_status as SubscriptionStatus,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        sortBy: sortBy as string,
        order: order as 'asc' | 'desc',
      };

      const companies = await this.sysAdminService.getAllCompanies(filters);
      return successResponse(res, 'Companies fetched successfully', companies);
    } catch (error: any) {
      return errorResponse(res, 'Error fetching companies', error.message, error.statusCode || 500);
    }
  };
  public getCompanyDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const company = await this.sysAdminService.getCompanyDetails(id);
      return successResponse(res, 'Company details fetched successfully', company);
    } catch (error: any) {
      return errorResponse(res, 'Error: something went wrong while performing action', error.message, error.statusCode || 500);
    }
  };
  public updateCompanyStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { subscription_status } = req.body;
      const updatedCompany = await this.sysAdminService.updateCompanyStatus(id, subscription_status);
      return successResponse(res, 'Company status updated successfully', updatedCompany.toString);
    } catch (error: any) {
      return errorResponse(res, 'Error: unable to update company status', error.message, error.statusCode || 500);
    }
  };
  public subscribeCompany = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;
      const subscribedCompany = await this.sysAdminService.subscribeCompany(id, new Date(expiryDate));
      return successResponse(res, 'Company subscribed successfully', subscribedCompany as any);
    } catch (error: any) {
      return errorResponse(res, 'Error: unable to complete action', error.message, error.statusCode || 500);
    }
  };
  // Cancel subscription
  public cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedCompany = await this.sysAdminService.cancelSubscription(id);
      return successResponse(res, 'Subscription canceled successfully', updatedCompany as any);
    } catch (error: any) {
      return errorResponse(res, 'Error: something went wrong', error.message, error.statusCode || 500);
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
      return errorResponse(res, 'Error: unable to renew subscription', error.message, error.statusCode || 500);
    }
  };
  // Add a new SysAdmin
  public addSysAdmin = async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;

      const result = await this.sysAdminService.addSysAdmin(name, email);

      return successResponse(res, result.message, result);
    } catch (error: any) {
      return errorResponse(res, 'Error: something went wrong, unable to complete action', error.message, error.statusCode || 500);
    }
  };

  // Deactivate a SysAdmin
  public deactivateSysAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deactivatedSysAdmin = await this.sysAdminService.deactivateSysAdmin(id);
      return successResponse(res, 'SysAdmin deactivated successfully', deactivatedSysAdmin as any);
    } catch (error: any) {
      return errorResponse(res, 'Error: unable to complete action', error.message, error.statusCode || 500);
    }
  };

  public getAllAdmins = async (req: Request, res: Response) => {
    try {
      const result = await this.sysAdminService.getAllAdmins();
      return successResponse(res, 'System admins fetched', result);
    } catch (error: any) {
      return errorResponse(res, 'Error unable to complete action', error.message, error.statusCode || 500);
    }
  };

  // In admin.controller.ts
  public getCompanyUsers = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const users = await this.sysAdminService.getCompanyUsers(companyId);
      return successResponse(res, 'Company users fetched successfully', users);
    } catch (error: any) {
      return errorResponse(res, 'Error unable to fetch users', error.message, error.statusCode || 500);
    }
  };
  // In admin.controller.ts
  public updateUserStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result: any = await this.sysAdminService.updateUserStatus(id);
      return successResponse(res, 'User status updated successfully', result);
    } catch (error: any) {
      return errorResponse(res, 'error unable to update status', error.message, error.statusCode || 500);
    }
  };

  public getTotalCompanies = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        subscription_status: req.query.subscription_status as SubscriptionStatus,
      };

      const total = await this.sysAdminService.getTotalCompanies(filters);

      return successResponse(res, 'Total companies retrieved successfully', { total });
    } catch (error: any) {
      return errorResponse(res, 'Error: unable to get total companies', error.message, error.statusCode || 500);
    }
  };
  public getTotalSubscriptions = async (req: Request, res: Response) => {
    try {
      const total = await this.sysAdminService.getTotalSubscriptions();
      return successResponse(res, 'Total subscriptions fetched', { total });
    } catch (error: any) {
      return errorResponse(res, 'Error: unable to fetch all subscriptions', error.message, error.statusCode || 500);
    }
  };
}
