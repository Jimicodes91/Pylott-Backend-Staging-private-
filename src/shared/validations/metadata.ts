import { body } from 'express-validator';
import { validateName } from './common';

export const createMetadataValidationRules = [
  validateName('name', false, {
    minLength: 2,
    maxLength: 100,
    customMessage: 'Numbers are not allowed in name.',
  }),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];

export const updateMetadataValidationRules = [
  validateName('name', true, {
    minLength: 2,
    maxLength: 100,
    customMessage: 'Numbers are not allowed in name.',
  }),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];
