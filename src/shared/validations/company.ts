import { body } from 'express-validator';

export const createCompanyValidationRule = [
  body('name')
    .notEmpty()
    .withMessage('Company name is required')
    .isString()
    .withMessage('Company name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('industry_type')
    .notEmpty()
    .withMessage('Industry type is required')
    .isString()
    .withMessage('Industry type must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry type must be between 2 and 50 characters'),

  body('size')
    .notEmpty()
    .withMessage('Company size is required')
    .isString()
    .withMessage('Company size must be a string')
    .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
    .withMessage('Company size must be one of: startup, small, medium, large, enterprise'),

  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isString()
    .withMessage('Country must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),

  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .withMessage('Address must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('city').notEmpty().withMessage('City is required').isString().withMessage('City must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),

  body('postal_code').optional().isString().withMessage('Postal code must be a string').trim().isLength({ min: 3, max: 20 }).withMessage('Postal code must be between 3 and 20 characters'),

  body('billing_email').optional().isEmail().withMessage('Billing email must be a valid email address').normalizeEmail(),
];

export const updateCompanyValidationRule = [
  body('name').optional().isString().withMessage('Company name must be a string').trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),

  body('industry_type').optional().isString().withMessage('Industry type must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('Industry type must be between 2 and 50 characters'),

  body('size')
    .optional()
    .isString()
    .withMessage('Company size must be a string')
    .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
    .withMessage('Company size must be one of: startup, small, medium, large, enterprise'),

  body('country').optional().isString().withMessage('Country must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters'),

  body('address').optional().isString().withMessage('Address must be a string').trim().isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),

  body('city').optional().isString().withMessage('City must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),

  body('postal_code').optional().isString().withMessage('Postal code must be a string').trim().isLength({ min: 3, max: 20 }).withMessage('Postal code must be between 3 and 20 characters'),

  body('billing_email').optional().isEmail().withMessage('Billing email must be a valid email address').normalizeEmail(),
];
