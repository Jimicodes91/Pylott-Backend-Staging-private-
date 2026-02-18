import { body } from 'express-validator';

// Helper function to validate name (no numbers allowed)
const validateName = (fieldName: string = 'name') => {
  return body(fieldName, 'Name is required')
    .not()
    .isEmpty()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name cannot contain numbers. Only letters, spaces, hyphens, and apostrophes are allowed');
};

export const addContactValidationRule = [
  validateName('name'),
  body('email', 'Email is required').not().isEmpty().isEmail().withMessage('Email must be a valid email address'),
  body('phone', 'Phone is required').not().isEmpty().isString().withMessage('Phone must be a string'),
  body('organization').optional().isString().withMessage('Organization must be a string'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('company_id').optional().isString().withMessage('Company ID must be a string'),
  body('assigned_to').optional().isArray().withMessage('Assigned to must be an array'),
  body('assigned_to.*.id').optional().isString().withMessage('Assignee ID must be a string'),
  body('assigned_to.*.name').optional().isString().withMessage('Assignee name must be a string'),
];

export const updateContactValidationRule = [
  validateName('name').optional(),
  body('email').optional().isEmail().withMessage('Email must be a valid email address'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('organization').optional().isString().withMessage('Organization must be a string'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('company_id').optional().isString().withMessage('Company ID must be a string'),
  body('assigned_to').optional().isArray().withMessage('Assigned to must be an array'),
  body('assigned_to.*.id').optional().isString().withMessage('Assignee ID must be a string'),
  body('assigned_to.*.name').optional().isString().withMessage('Assignee name must be a string'),
];
