import { body } from 'express-validator';

export const createMetadataValidationRules = [
  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be between 2 and 100 characters').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];

export const updateMetadataValidationRules = [
  body('name').optional().withMessage('Name is required').isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be between 2 and 100 characters').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];
