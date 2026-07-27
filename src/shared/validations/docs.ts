import { body } from 'express-validator';

export const uploadDocumentValidationRules = [
  body('document_type_id').optional().isUUID().withMessage('Document Type Id must be a valid UUID'),

  body('description').optional().isString().withMessage('Description must be a string').trim(),

  body('file_name').notEmpty().withMessage('File name is required').isString().withMessage('File name must be a string').trim(),

  body('attachment')
    .notEmpty()
    .withMessage('Attachment is required')
    .isString()
    .withMessage('Attachment must be a string')
    .custom((value) => {
      // Accept both pure base64 and data URL format (data:mime;base64,...)
      let base64String = value;
      if (value.includes(',')) {
        base64String = value.split(',')[1];
      }
      const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
      if (!base64Regex.test(base64String)) {
        throw new Error('Attachment must be a valid base64 string');
      }
      return true;
    }),

  // Expiry fields (optional)
  body('issue_date').optional({ values: 'null' }).isISO8601().withMessage('Issue date must be a valid date'),
  body('expiry_date').optional({ values: 'null' }).isISO8601().withMessage('Expiry date must be a valid date'),
  body('does_not_expire').optional().isBoolean().withMessage('does_not_expire must be a boolean'),
];

export const updateUploadDocumentValidationRules = [
  body('document_type_id').optional().isUUID().withMessage('Document Type Id must be a valid UUID'),
  body('description').optional().isString().withMessage('Description must be a string').trim(),
  body('file_name').optional().notEmpty().withMessage('File name cannot be empty if provided').isString().withMessage('File name must be a string').trim(),
  body('issue_date').optional({ values: 'null' }).isISO8601().withMessage('Issue date must be a valid date'),
  body('expiry_date').optional({ values: 'null' }).isISO8601().withMessage('Expiry date must be a valid date'),
  body('does_not_expire').optional().isBoolean().withMessage('does_not_expire must be a boolean'),
];

export const updateDocumentAttachmentValidationRules = [body('attachment').notEmpty().withMessage('Attachment is required').isString().withMessage('Attachment must be a string')];
