// shared/validations/subscription.ts
import { body, param } from 'express-validator';
import { SubscriptionPlan } from '@/shared/utils/subscription.type';

export const getCompanySubscriptionValidationRule = [param('companyId').notEmpty().withMessage('Company ID is required').isUUID().withMessage('Company ID must be a valid UUID')];

export const subscribeCompanyValidationRule = [
  param('companyId').notEmpty().withMessage('Company ID is required').isUUID().withMessage('Company ID must be a valid UUID'),

  body('plan')
    .notEmpty()
    .withMessage('Subscription plan is required')
    .isIn(Object.values(SubscriptionPlan))
    .withMessage(`Plan must be one of: ${Object.values(SubscriptionPlan).join(', ')}`),

  body('payment_method_id').optional().isString().withMessage('Payment method ID must be a string'),
];

export const cancelCompanySubscriptionValidationRule = [param('companyId').notEmpty().withMessage('Company ID is required').isUUID().withMessage('Company ID must be a valid UUID')];
