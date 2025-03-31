import { body } from 'express-validator';

export const createProjectTypeValidationRules = [
  body('company_id').notEmpty().withMessage('Company ID is required').isUUID().withMessage('Company ID must be a valid UUID'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer((value) => value.replace(/\s+/g, ' ')), // Normalize whitespace

  body('is_system').optional().isBoolean().withMessage('is_system must be a boolean').toBoolean(),
];

export const updateProjectTypeValidationRules = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer((value) => value.replace(/\s+/g, ' ')), // Normalize whitespace

  body('is_system').optional().isBoolean().withMessage('is_system must be a boolean').toBoolean(),
];
