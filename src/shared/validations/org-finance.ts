import { body } from 'express-validator';
import { parseISO, isValid, parse } from 'date-fns';

export const createOrgFinanceValidationRules = [
  body('client_name')
    .notEmpty()
    .withMessage('Client name is required')
    .isString()
    .withMessage('Client name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters'),

  body('project_title')
    .notEmpty()
    .withMessage('Project title is required')
    .isString()
    .withMessage('Project title must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Project title must be between 2 and 200 characters'),

  body('total_project_cost')
    .notEmpty()
    .withMessage('Total project cost is required')
    .isString()
    .withMessage('Total project cost must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Total project cost must be a valid number with up to 2 decimal places'),

  body('outstanding_balance')
    .notEmpty()
    .withMessage('Outstanding balance is required')
    .isString()
    .withMessage('Outstanding balance must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Outstanding balance must be a valid number with up to 2 decimal places'),

  body('next_payment_due_date')
    .notEmpty()
    .withMessage('Next payment due date is required')
    .isString()
    .withMessage('Next payment due date must be a string')
    .custom((value) => {
      // Try multiple date formats
      let date;
      if (value.includes('/')) {
        // Handle formats like "2026/3/2" or "2026/03/02"
        date = parse(value, 'yyyy/M/d', new Date());
      } else {
        // Handle ISO format "2026-03-02"
        date = parseISO(value);
      }

      if (!isValid(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD or YYYY/M/D format');
      }
      return true;
    }),

  body('organization_id').notEmpty().withMessage('Organization ID is required').isUUID().withMessage('Organization ID must be a valid UUID'),

  body('payment_status').optional().isString().withMessage('Payment status must be a string').isIn(['pending', 'partial', 'paid']).withMessage('Payment status must be one of: pending, partial, paid'),

  body('hasPaid').optional().isBoolean().withMessage('hasPaid must be a boolean'),
];

export const updateOrgFinanceValidationRules = [
  body('client_name').optional().isString().withMessage('Client name must be a string').trim().isLength({ min: 2, max: 100 }).withMessage('Client name must be between 2 and 100 characters'),

  body('project_title').optional().isString().withMessage('Project title must be a string').trim().isLength({ min: 2, max: 200 }).withMessage('Project title must be between 2 and 200 characters'),

  body('total_project_cost')
    .optional()
    .isString()
    .withMessage('Total project cost must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Total project cost must be a valid number with up to 2 decimal places'),

  body('amount_paid')
    .optional()
    .isString()
    .withMessage('Amount paid must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Amount paid must be a valid number with up to 2 decimal places'),

  body('outstanding_balance')
    .optional()
    .isString()
    .withMessage('Outstanding balance must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Outstanding balance must be a valid number with up to 2 decimal places'),

  body('next_payment_due_date')
    .optional()
    .isString()
    .withMessage('Next payment due date must be a string')
    .custom((value) => {
      // Try multiple date formats
      let date;
      if (value.includes('/')) {
        // Handle formats like "2026/3/2" or "2026/03/02"
        date = parse(value, 'yyyy/M/d', new Date());
      } else {
        // Handle ISO format "2026-03-02"
        date = parseISO(value);
      }

      if (!isValid(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD or YYYY/M/D format');
      }
      return true;
    }),

  body('organization_id').optional().isUUID().withMessage('Organization ID must be a valid UUID'),

  body('payment_status').optional().isString().withMessage('Payment status must be a string').isIn(['pending', 'partial', 'paid']).withMessage('Payment status must be one of: pending, partial, paid'),

  body('hasPaid').optional().isBoolean().withMessage('hasPaid must be a boolean'),
];

export const markAsPaidValidationRules = [
  body('amount_paid')
    .notEmpty()
    .withMessage('Amount paid is required')
    .isString()
    .withMessage('Amount paid must be a string')
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage('Amount paid must be a valid number with up to 2 decimal places'),
];
