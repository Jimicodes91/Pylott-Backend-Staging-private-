import { body, param } from 'express-validator';

export const uploadDocumentValidationRules = [
  param('project_id').isUUID().withMessage('Project Id must be a valid UUID'),

  body('document_type_id').isUUID().withMessage('Document Type Id must be a valid UUID'),

  body('description').optional().isString().withMessage('Description must be a string').trim(),

  body('file_name').notEmpty().withMessage('File name is required').isString().withMessage('File name must be a string').trim(),

  body('attachment')
    .notEmpty()
    .withMessage('Attachment is required')
    .isString()
    .withMessage('Attachment must be a string')
    .custom((value) => {
      const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
      if (!base64Regex.test(value)) {
        throw new Error('Attachment must be a valid base64 string');
      }
      return true;
    }),
];

export const updateUploadDocumentValidationRules = [
  body('document_type_id').optional().isUUID().withMessage('Document Type Id must be a valid UUID'),

  body('description').optional().isString().withMessage('Description must be a string').trim(),

  body('file_name').optional().notEmpty().withMessage('File name cannot be empty if provided').isString().withMessage('File name must be a string').trim(),
];

export const updateDocumentAttachmentValidationRules = [
  body('attachment')
    .notEmpty()
    .withMessage('Attachment is required')
    .isString()
    .withMessage('Attachment must be a string')
    .custom((value) => {
      const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
      if (!base64Regex.test(value)) {
        throw new Error('Attachment must be a valid base64 string');
      }
      return true;
    }),
];
