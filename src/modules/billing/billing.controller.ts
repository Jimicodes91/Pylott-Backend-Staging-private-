import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import HttpError from '@/shared/utils/errorHandler';
import { BillingService } from './billing.service';
import { SubscriptionPlan, CreateSubscriptionPlanInput, UpdateSubscriptionPlanInput } from '@/shared/utils/subscription.type';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  async getBillingOverview(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) throw new HttpError('Company not found', 400);

      const overview = await this.billingService.getCompanyBillingOverview(companyId);
      return successResponse(res, 'Billing overview retrieved', overview);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async upgradePlan(req: Request, res: Response) {
    try {
      const { plan } = req.body;
      const companyId = req.user?.company_id;

      if (!companyId || !plan) {
        throw new HttpError('Company ID and plan are required', 400);
      }

      const result = await this.billingService.changeSubscriptionPlan(companyId, plan);
      return successResponse(res, 'Plan upgraded successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) throw new HttpError('Company not found', 400);

      const result = await this.billingService.cancelSubscription(companyId);
      return successResponse(res, result.message, result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  // Add these methods to your existing BillingController class

  async addPaymentMethod(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      const { type, details } = req.body;

      if (!companyId || !type) {
        throw new HttpError('Company ID and payment method type are required', 400);
      }

      const paymentMethod = await this.billingService.addPaymentMethod(companyId, {
        type,
        details,
      });

      return successResponse(res, 'Payment method added', paymentMethod);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getPaymentMethods(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) throw new HttpError('Company not found', 400);

      const methods = await this.billingService.getPaymentMethods(companyId);
      return successResponse(res, 'Payment methods retrieved', methods);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async setDefaultPaymentMethod(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      const { paymentMethodId } = req.body;

      if (!companyId || !paymentMethodId) {
        throw new HttpError('Company ID and payment method ID are required', 400);
      }

      const result = await this.billingService.setDefaultPaymentMethod(companyId, paymentMethodId);
      return successResponse(res, 'Default payment method updated', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getInvoices(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) throw new HttpError('Company not found', 400);

      const invoices = await this.billingService.getInvoices(companyId);
      return successResponse(res, 'Invoices retrieved', invoices);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  //updated plans

  getAllPlans = async (req: Request, res: Response) => {
    try {
      const plans = await this.billingService.getSubscriptionPlans();
      return successResponse(res, 'Subscription plans retrieved', plans);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  getPlan = async (req: Request, res: Response) => {
    try {
      const { planName } = req.params;
      const plan = await this.billingService.getPlanDetails(planName as SubscriptionPlan);
      return successResponse(res, 'Subscription plan retrieved', plan);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  createPlan = async (req: Request, res: Response) => {
    try {
      const data = req.body as CreateSubscriptionPlanInput;
      const plan = await this.billingService.createSubscriptionPlan(data);
      return successResponse(res, 'Subscription plan created', plan, 201);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  updatePlan = async (req: Request, res: Response) => {
    try {
      const { planName } = req.params;
      const data = req.body as UpdateSubscriptionPlanInput;
      const plan = await this.billingService.updateSubscriptionPlan(planName as SubscriptionPlan, data);
      return successResponse(res, 'Subscription plan updated', plan);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  deletePlan = async (req: Request, res: Response) => {
    try {
      const { planName } = req.params;
      await this.billingService.deleteSubscriptionPlan(planName as SubscriptionPlan);
      return successResponse(res, 'Subscription plan deleted');
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  // Add more endpoints for:
  // - Adding payment methods
  // - Viewing invoices
  // - Payment retries
  // - etc.
}
