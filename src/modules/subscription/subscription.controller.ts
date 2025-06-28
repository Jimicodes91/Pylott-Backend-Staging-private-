import { Response, Request } from 'express';
import { injectable } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { SubscriptionService } from './subscription.service';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public subscribeCompany = async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;
      const subscriptionData = req.body;

      if (!companyId) {
        return errorResponse(res, 'Company ID is required');
      }

      const subscription = await this.subscriptionService.subscribeCompany(companyId, subscriptionData);

      return successResponse(res, 'Company subscribed successfully', subscription, 201);
    } catch (error: any) {
      console.error('SUBSCRIBE_COMPANY_ERROR:', error);
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public getCompanySubscription = async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;

      if (!companyId) {
        return errorResponse(res, 'Company ID is required');
      }

      const subscriptionData = await this.subscriptionService.getCompanySubscription(companyId);

      return successResponse(res, 'Company subscription retrieved successfully', subscriptionData);
    } catch (error: any) {
      console.error('GET_COMPANY_SUBSCRIPTION_ERROR:', error);
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public cancelCompanySubscription = async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;

      if (!companyId) {
        return errorResponse(res, 'Company ID is required');
      }

      const canceledSubscription = await this.subscriptionService.cancelCompanySubscription(companyId);

      return successResponse(res, 'Company subscription canceled successfully', canceledSubscription);
    } catch (error: any) {
      console.error('CANCEL_COMPANY_SUBSCRIPTION_ERROR:', error);
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
