import { container } from 'tsyringe';
import { Server } from '@/shared/types/http.type';
import { SubscriptionController } from './subscription.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { subscribeCompanyValidationRule, getCompanySubscriptionValidationRule, cancelCompanySubscriptionValidationRule } from '@/shared/middlewares/validation/subscription-validation';

const subscriptionController = container.resolve(SubscriptionController);

export const subscriptionRoutes = (prefix: string, server: Server) => {
  // Subscribe company to a plan
  server.post(
    `${prefix}/:companyId/subscribe`,

    schemaValidator(subscribeCompanyValidationRule),
    subscriptionController.subscribeCompany,
  );

  // Get company subscription details
  server.get(
    `${prefix}/:companyId/subscription`,

    schemaValidator(getCompanySubscriptionValidationRule),
    subscriptionController.getCompanySubscription,
  );

  // Cancel company subscription
  server.put(`${prefix}/:companyId/subscription/cancel`, schemaValidator(cancelCompanySubscriptionValidationRule), subscriptionController.cancelCompanySubscription);
};
