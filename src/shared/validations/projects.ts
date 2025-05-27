import { isAfter, isValid, parseISO } from 'date-fns';
import { body } from 'express-validator';

import { FieldTypeEnum, ProjectMemberTypeEnum, ProjectStatus } from '@/shared/enums';

export const createProjectTypeValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer((value) => value.replace(/\s+/g, ' ')),

  body('is_system').optional().isBoolean().withMessage('is_system must be a boolean').toBoolean(),

  body('stages').optional().isArray().withMessage('Stages must be an array'),

  body('stages.*.name')
    .notEmpty()
    .withMessage('Milestone name is required')
    .isString()
    .withMessage('Milestone name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Milestone name must be between 2 and 100 characters'),

  body('stages.*.duration').notEmpty().withMessage('Duration is required').isInt({ min: 1 }).withMessage('Duration must be a positive integer').toInt(),

  // body('custom_fields')
  //   .optional()
  //   .isArray()
  //   .withMessage('Custom fields must be an array')
  //   .custom((fields) => fields.length <= 20)
  //   .withMessage('Maximum 20 custom fields allowed')
  //   .customSanitizer((fields) => fields || []),

  // body('custom_fields.*.name')
  //   .notEmpty()
  //   .withMessage('Field name is required')
  //   .isString()
  //   .withMessage('Field name must be a string')
  //   .trim()
  //   .isLength({ min: 2, max: 50 })
  //   .withMessage('Field name must be between 2 and 50 characters'),

  // body('custom_fields.*.field_key')
  //   .notEmpty()
  //   .withMessage('Field key is required')
  //   .isString()
  //   .withMessage('Field key must be a string')
  //   .trim()
  //   .matches(/^[a-z0-9_]+$/)
  //   .withMessage('Field key can only contain lowercase letters, numbers and underscores')
  //   .isLength({ min: 2, max: 30 })
  //   .withMessage('Field key must be between 2 and 30 characters'),

  // body('custom_fields.*.field_type')
  //   .notEmpty()
  //   .withMessage('Field type is required')
  //   .isIn(Object.values(FieldTypeEnum))
  //   .withMessage(`Invalid field type. Valid types are: ${Object.values(FieldTypeEnum).join(', ')}`),

  // body('custom_fields.*.is_required').optional().isBoolean().withMessage('is_required must be a boolean').toBoolean(),

  // body('custom_fields.*.order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer').toInt(),

  // body('custom_fields.*.options')
  //   .optional()
  //   .custom((value, { req }) => {
  //     const field = req.body.custom_fields?.[req.path.match(/\[(\d+)\]/)?.[1]];
  //     if (field?.field_type === FieldTypeEnum.SELECT) {
  //       if (!Array.isArray(value)) {
  //         throw new Error('Options must be an array for SELECT fields');
  //       }
  //       if (value.length === 0) {
  //         throw new Error('SELECT fields require at least one option');
  //       }
  //     }
  //     return true;
  //   }),
];

export const updateProjectTypeValidationRules = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer((value) => value.replace(/\s+/g, ' ')),

  body('is_system').optional().isBoolean().withMessage('is_system must be a boolean').toBoolean(),

  body('custom_fields')
    .optional()
    .isArray()
    .withMessage('Custom fields must be an array')
    .custom((fields) => fields.length <= 20)
    .withMessage('Maximum 20 custom fields allowed')
    .customSanitizer((fields) => fields || []),

  body('custom_fields.*.name').optional().isString().withMessage('Field name must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('Field name must be between 2 and 50 characters'),

  body('custom_fields.*.field_key')
    .optional()
    .isString()
    .withMessage('Field key must be a string')
    .trim()
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Field key can only contain lowercase letters, numbers and underscores')
    .isLength({ min: 2, max: 30 })
    .withMessage('Field key must be between 2 and 30 characters'),

  body('custom_fields.*.field_type')
    .optional()
    .isIn(Object.values(FieldTypeEnum))
    .withMessage(`Invalid field type. Valid types are: ${Object.values(FieldTypeEnum).join(', ')}`),

  body('custom_fields.*.is_required').optional().isBoolean().withMessage('is_required must be a boolean').toBoolean(),

  body('custom_fields.*.order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer').toInt(),

  body('custom_fields.*.options')
    .optional()
    .custom((value, { req }) => {
      const field = req.body.custom_fields?.[req.path.match(/\[(\d+)\]/)?.[1]];
      if (field?.field_type === FieldTypeEnum.SELECT) {
        if (!Array.isArray(value)) {
          throw new Error('Options must be an array for SELECT fields');
        }
        if (value.length === 0) {
          throw new Error('SELECT fields require at least one option');
        }
      }
      return true;
    }),
];

export const updateCustomFieldsValidationRules = [
  body()
    .isArray()
    .withMessage('Request body must be an array')
    .custom((fields) => fields.length <= 20)
    .withMessage('Maximum 20 custom fields allowed'),

  body('*.name').optional().isString().withMessage('Field name must be a string').trim().isLength({ min: 2, max: 50 }).withMessage('Field name must be between 2 and 50 characters'),

  body('*.field_key')
    .optional()
    .isString()
    .withMessage('Field key must be a string')
    .trim()
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Field key can only contain lowercase letters, numbers and underscores')
    .isLength({ min: 2, max: 30 })
    .withMessage('Field key must be between 2 and 30 characters'),

  body('*.field_type')
    .optional()
    .isIn(Object.values(FieldTypeEnum))
    .withMessage(`Invalid field type. Valid types are: ${Object.values(FieldTypeEnum).join(', ')}`),

  body('*.is_required').optional().isBoolean().withMessage('is_required must be a boolean').toBoolean(),

  body('*.order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer').toInt(),

  body('*.options')
    .optional()
    .custom((value, { req }) => {
      const index = req.path.match(/\[(\d+)\]/)?.[1];
      const field = Array.isArray(req.body) ? req.body[index] : null;
      if (field?.field_type === FieldTypeEnum.SELECT) {
        if (!Array.isArray(value)) {
          throw new Error('Options must be an array for SELECT fields');
        }
        if (value.length === 0) {
          throw new Error('SELECT fields require at least one option');
        }
      }
      return true;
    }),
];

export const createMilestoneValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),

  body('duration').notEmpty().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),

  // body('start_date')
  //   .notEmpty()
  //   .withMessage('Start date is required')
  //   .isISO8601()
  //   .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)')
  //   .custom((value) => {
  //     const date = parseISO(value);
  //     if (!isValid(date)) throw new Error('Invalid start date');
  //     if (isAfter(date, new Date(2030, 11, 31))) {
  //       // Months are 0-indexed (11 = December)
  //       throw new Error('Start date cannot be after December 31, 2030');
  //     }
  //     return true;
  //   }),

  // body('end_date')
  //   .notEmpty()
  //   .withMessage('End date is required')
  //   .isISO8601()
  //   .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)')
  //   .custom((value, { req }) => {
  //     const startDate = parseISO(req.body.start_date);
  //     const endDate = parseISO(value);

  //     if (!isValid(endDate)) throw new Error('Invalid end date');
  //     if (!isAfter(endDate, startDate)) {
  //       throw new Error('End date must be after start date');
  //     }
  //     if (isAfter(endDate, new Date(2030, 11, 31))) {
  //       throw new Error('End date cannot be after December 31, 2030');
  //     }
  //     return true;
  //   }),

  body('project_type_id').notEmpty().withMessage('Project type ID is required').isUUID('4').withMessage('Project type ID must be a valid UUID v4'),
];

export const updateMilestoneValidationRules = [
  body('name').optional().isString().withMessage('Name must be a string').trim().escape().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),

  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),

  // body('start_date')
  //   .optional()
  //   .isISO8601()
  //   .withMessage('Start date must be in ISO 8601 format')
  //   .custom((value, { req }) => {
  //     const date = parseISO(value);
  //     if (!isValid(date)) throw new Error('Invalid start date');

  //     // Validate against existing end_date if provided in same request
  //     if (req.body.end_date) {
  //       const endDate = parseISO(req.body.end_date);
  //       if (isAfter(date, endDate)) {
  //         throw new Error('Start date cannot be after end date');
  //       }
  //     }
  //     return true;
  //   }),

  // body('end_date')
  //   .optional()
  //   .isISO8601()
  //   .withMessage('End date must be in ISO 8601 format')
  //   .custom((value, { req }) => {
  //     const date = parseISO(value);
  //     if (!isValid(date)) throw new Error('Invalid end date');

  //     if (req.body.start_date) {
  //       const startDate = parseISO(req.body.start_date);
  //       if (!isAfter(date, startDate)) {
  //         throw new Error('End date must be after start date');
  //       }
  //     }
  //     return true;
  //   }),

  body('is_completed').optional().isBoolean().withMessage('Completion status must be true or false').toBoolean(),
];

export const toggleProjectSettingsValidationRules = [
  body('client_can_view_task').notEmpty().withMessage('Task visibility setting is required').isBoolean().withMessage('Task visibility must be a boolean').toBoolean(),

  body('client_can_view_notes').notEmpty().withMessage('Notes visibility setting is required').isBoolean().withMessage('Notes visibility must be a boolean').toBoolean(),

  body('client_can_view_documents').notEmpty().withMessage('Documents visibility setting is required').isBoolean().withMessage('Documents visibility must be a boolean').toBoolean(),

  body('client_can_view_activity').notEmpty().withMessage('Activity visibility setting is required').isBoolean().withMessage('Activity visibility must be a boolean').toBoolean(),
];

export const createProjectValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .isString()
    .withMessage('Project name must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be 3-100 characters'),

  body('description').optional().isString().withMessage('Description must be a string').trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('client_id').notEmpty().withMessage('Client ID is required').isUUID().withMessage('Client ID must be a valid UUID'),

  body('consultant_id').optional().isUUID().withMessage('Consultant ID must be a valid UUID'),

  body('project_type_id').notEmpty().withMessage('Project type ID is required').isUUID().withMessage('Project type ID must be a valid UUID'),

  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format')
    .custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) throw new Error('Invalid start date');
      if (isAfter(date, new Date(2030, 11, 31))) {
        throw new Error('Start date cannot be after 2030-12-31');
      }
      return true;
    }),

  body('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const date = parseISO(value);
      if (!isValid(date)) throw new Error('Invalid end date');
      if (isAfter(date, new Date(2030, 11, 31))) {
        throw new Error('End date cannot be after 2030-12-31');
      }
      if (req.body.start_date) {
        const startDate = parseISO(req.body.start_date);
        if (!isAfter(date, startDate)) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  body('milestone_id').optional().isUUID().withMessage('Milestone ID must be a valid UUID'),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(Object.values(ProjectStatus))
    .withMessage(`Invalid project status. Valid statuses: ${Object.values(ProjectStatus).join(', ')}`),

  body('custom_fields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
    .customSanitizer((value) => value || {}),
];

export const updateProjectValidationRules = [
  body('name').optional().isString().withMessage('Project name must be a string').trim().isLength({ min: 3, max: 100 }).withMessage('Project name must be 3-100 characters'),

  body('description').optional().isString().withMessage('Description must be a string').trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('client_id').optional().isUUID().withMessage('Client ID must be a valid UUID'),

  body('consultant_id').optional().isUUID().withMessage('Consultant ID must be a valid UUID'),

  body('project_type_id').optional().isUUID().withMessage('Project type ID must be a valid UUID'),

  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format')
    .custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) throw new Error('Invalid start date');
      if (isAfter(date, new Date(2030, 11, 31))) {
        throw new Error('Start date cannot be after 2030-12-31');
      }
      return true;
    }),

  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((value, { req }) => {
      const date = parseISO(value);
      if (!isValid(date)) throw new Error('Invalid end date');
      if (isAfter(date, new Date(2030, 11, 31))) {
        throw new Error('End date cannot be after 2030-12-31');
      }
      if (req.body.start_date) {
        const startDate = parseISO(req.body.start_date);
        if (!isAfter(date, startDate)) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  body('milestone_id').optional().isUUID().withMessage('Milestone ID must be a valid UUID'),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(Object.values(ProjectStatus))
    .withMessage(`Invalid project status. Valid statuses: ${Object.values(ProjectStatus).join(', ')}`),

  body('custom_fields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
    .customSanitizer((value) => value || {}),
];

export const createTaskValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Task name is required')
    .isString()
    .withMessage('Task name must be a string')
    .isLength({ max: 100 })
    .withMessage('Task name cannot be longer than 100 characters'),

  body('description').trim().notEmpty().withMessage('Description is required').isString().withMessage('Description must be a string'),

  body('status').optional().trim().isString().withMessage('Status must be a string').isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status value'),

  body('start_date').trim().notEmpty().withMessage('Start date is required').isISO8601().withMessage('Start date must be a valid ISO8601 date'),

  body('end_date')
    .trim()
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),

  body('assignees')
    .optional()
    .isArray()
    .withMessage('Assignees must be an array')
    .custom((value) => {
      if (value.some((item: any) => typeof item !== 'string')) {
        throw new Error('All assignee IDs must be strings');
      }
      return true;
    }),

  body('task_type_id').trim().isString().withMessage('Task type ID must be a string'),

  body('project_type_id').notEmpty().isString().withMessage('Project type ID must be a string'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value.some((item: any) => typeof item !== 'string')) {
        throw new Error('All attachments must be strings');
      }
      return true;
    }),

  body('is_visible_to_client').notEmpty().withMessage('Visibility to client is required').isBoolean().withMessage('Visibility must be a boolean').toBoolean(),
];

export const updateTaskValidationRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task name cannot be empty')
    .isString()
    .withMessage('Task name must be a string')
    .isLength({ max: 100 })
    .withMessage('Task name cannot be longer than 100 characters'),

  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty').isString().withMessage('Description must be a string'),

  body('status')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Status cannot be empty')
    .isString()
    .withMessage('Status must be a string')
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Invalid status value'),

  body('start_date').optional().trim().notEmpty().withMessage('Start date cannot be empty').isISO8601().withMessage('Start date must be a valid ISO8601 date'),

  body('end_date')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('End date cannot be empty')
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),

  body('assignees')
    .optional()
    .isArray()
    .withMessage('Assignees must be an array')
    .custom((value) => {
      if (value.some((item: any) => typeof item !== 'string')) {
        throw new Error('All assignee IDs must be strings');
      }
      return true;
    }),

  body('task_type_id').trim().optional().isString().withMessage('Task type ID must be a string'),

  body('project_type_id').optional().notEmpty().isString().withMessage('Project type ID must be a string'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value && value.some((item: any) => typeof item !== 'string')) {
        throw new Error('All attachments must be strings');
      }
      return true;
    }),

  body('is_visible_to_client').optional().isBoolean().withMessage('Visibility must be a boolean').toBoolean(),
];

export const addProjectMemberValidationRules = [
  body('user_id').notEmpty().withMessage('User ID is required').isString().withMessage('User ID must be a string').trim(),
  body('member_type')
    .optional()
    .isIn(Object.values(ProjectMemberTypeEnum))
    .withMessage(`Invalid field type. Valid types are: ${Object.values(ProjectMemberTypeEnum).join(', ')}`),

  body('is_visible_to_client').optional().isBoolean().withMessage('is_visible_to_client must be a boolean').toBoolean(),
];

export const createNoteValidationRules = [
  body('content').trim().notEmpty().withMessage('Content is required').isString().withMessage('Content must be a string').isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),

  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array')
    .custom((value: any[]) => {
      if (value.some((item) => typeof item !== 'string')) {
        throw new Error('All mentions must be strings');
      }
      return true;
    }),

  body('attachments')
    .isArray({ min: 1 })
    .withMessage('At least one attachment is required')
    .custom((value: any[]) => {
      if (value.some((item) => typeof item !== 'string')) {
        throw new Error('All attachments must be strings');
      }
      return true;
    }),

  body('attachments.*').optional().isURL().withMessage('Each attachment must be a valid URL'),

  body('is_pinned').optional().isBoolean().withMessage('is_pinned must be a boolean').toBoolean(),
];

export const createCommentValidationRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isString()
    .withMessage('Content must be a string')
    .isLength({
      min: 1,
      max: 1000,
    })
    .withMessage('Comment must be between 1-1000 characters')
    .escape(),
];

export const toggleNotePinValidationRules = [body('is_pinned').isBoolean().withMessage('is_pinned must be a boolean').toBoolean()];

export const documentRequestValidationRules = [
  body('document_type_id').trim().notEmpty().withMessage('Document type ID is required').isString().withMessage('Document type ID must be a string'),

  body('assignee_id').trim().notEmpty().withMessage('Assignee ID is required').isString().withMessage('Assignee ID must be a string'),

  body('name').trim().notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('description').trim().notEmpty().withMessage('Description is required').isString().withMessage('Description must be a string'),

  body('is_visible_to_client').notEmpty().withMessage('Visibility flag is required').isBoolean().withMessage('Visibility must be a boolean').toBoolean(),

  body('end_date')
    .trim()
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be in ISO8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('End date cannot be in the past');
      }
      return true;
    }),
];

export const addCustomFieldValidationRules = [
  body('name').notEmpty().withMessage('Field name is required'),
  body('type').notEmpty().withMessage('Field type is required').isIn(['text', 'number', 'date', 'select', 'document']).withMessage('Invalid field type'),
  body('is_required').optional().isBoolean().withMessage('is_required must be a boolean'),
  body('options')
    .optional()
    .custom((value, { req }) => {
      if (req.body.type === 'select' && (!value || !Array.isArray(value) || value.length === 0)) {
        throw new Error('Options are required for select fields');
      }
      return true;
    }),
  body('is_multiple')
    .optional()
    .isBoolean()
    .withMessage('is_multiple must be a boolean')
    .custom((value, { req }) => {
      if (value && req.body.type !== 'document') {
        throw new Error('is_multiple is only applicable to document fields');
      }
      return true;
    }),
  body('max_files')
    .optional()
    .isInt({ min: 1 })
    .withMessage('max_files must be a positive integer')
    .custom((value, { req }) => {
      if (value && req.body.type !== 'document') {
        throw new Error('max_files is only applicable to document fields');
      }
      return true;
    }),
  body('accepted_types')
    .optional()
    .isString()
    .withMessage('accepted_types must be a string')
    .custom((value, { req }) => {
      if (value && req.body.type !== 'document') {
        throw new Error('accepted_types is only applicable to document fields');
      }
      return true;
    }),
];

export const updateFieldRequirementValidationRules = [body('is_required').isBoolean().withMessage('is_required must be a boolean')];
