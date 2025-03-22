import { body, param } from 'express-validator';

export const createEventValidationRules = [
  param('project_id').isUUID().withMessage('Project Id must be a valid UUID'),

  body('event_type_id').isUUID().withMessage('Event Type Id must be a valid UUID'),

  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),

  body('start_datetime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('end_datetime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((value, { req }) => {
      if (value <= req.body.start_datetime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('venue').notEmpty().withMessage('Venue is required').isString().withMessage('Venue must be a string').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];

export const updateEventValidationRules = [
  param('id').isUUID().withMessage('Event Id must be a valid UUID'),

  param('project_id').isUUID().withMessage('Project Id must be a valid UUID'),

  body('event_type_id').optional().isUUID().withMessage('Event Type Id must be a valid UUID'),

  body('name').optional().isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),

  body('start_datetime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('end_datetime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((value, { req }) => {
      if (req.body.start_datetime && value <= req.body.start_datetime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('venue').optional().isString().withMessage('Venue must be a string').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),
];
