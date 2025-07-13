import { body, param } from 'express-validator';

export const createEventValidationRules = [
  param('project_id').isUUID().withMessage('Project Id must be a valid UUID'),

  body('event_type_id').isUUID().optional().withMessage('Event Type Id must be a valid UUID'),

  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),

  body('start_datetime').notEmpty().withMessage('Start datetime is required').isISO8601().withMessage('Start datetime must be in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)').toDate(),

  body('end_datetime')
    .notEmpty()
    .withMessage('End datetime is required')
    .isISO8601()
    .withMessage('End datetime must be in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error('End datetime must be after start datetime');
      }
      return true;
    }),

  body('venue').notEmpty().withMessage('Venue is required').isString().withMessage('Venue must be a string').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),

  body('invites')
    .notEmpty()
    .isArray()
    .withMessage('Invites must be an array')
    .custom((invites) => {
      if (!invites) return true;

      if (!Array.isArray(invites)) {
        throw new Error('Invites must be an array');
      }

      for (const email of invites) {
        if (typeof email !== 'string') {
          throw new Error('Each invite must be a string email');
        }

        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }

      return true;
    }),
];

export const updateEventValidationRules = [
  param('id').isUUID().withMessage('Event Id must be a valid UUID'),

  param('project_id').isUUID().withMessage('Project Id must be a valid UUID'),

  body('event_type_id').optional().isUUID().optional().withMessage('Event Type Id must be a valid UUID'),

  body('name').optional().isString().withMessage('Name must be a string').isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),

  body('start_datetime').optional().isISO8601().withMessage('Start datetime must be in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)').toDate(),

  body('end_datetime')
    .optional()
    .isISO8601()
    .withMessage('End datetime must be in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.start_datetime && new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error('End datetime must be after start datetime');
      }
      return true;
    }),

  body('venue').optional().isString().withMessage('Venue must be a string').trim(),

  body('description').optional().isString().withMessage('Description must be a string').trim(),

  body('invites')
    .optional()
    .isArray()
    .withMessage('Invites must be an array')
    .custom((invites) => {
      if (!invites) return true;

      if (!Array.isArray(invites)) {
        throw new Error('Invites must be an array');
      }

      for (const email of invites) {
        if (typeof email !== 'string') {
          throw new Error('Each invite must be a string email');
        }

        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }

      return true;
    }),
];
