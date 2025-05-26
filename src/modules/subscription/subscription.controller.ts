import { Response, Request } from 'express';
import { injectable } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { SubscriptionService } from './subscription.service';

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
      return errorResponse(res, 'Error subscribing company', error.message, error.statusCode || 500);
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
      return errorResponse(res, 'Error getting company subscription', error.message, error.statusCode || 500);
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
      return errorResponse(res, 'An error occured while performing this operation', error.message, error.statusCode || 500);
    }
  };
}
