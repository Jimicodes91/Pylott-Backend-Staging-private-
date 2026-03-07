import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';
import { updateDocumentAttachmentValidationRules, updateUploadDocumentValidationRules, uploadDocumentValidationRules } from '@/shared/validations/docs';
import { documentRequestValidationRules } from '@/shared/validations/projects';

// Lazy controller resolution with dynamic imports
const getDocumentController = async () => {
  const { DocsController } = await import('./docs.controller');
  return container.resolve(DocsController);
};

export const docsRoutes = (prefix: string, server: Server) => {
  /**
   * Documents
   */
  server.get(`${prefix}/:project_id/documents`, authGuard, async (req, res) => (await getDocumentController()).getAllDocuments(req, res));
  server.get(`${prefix}/:project_id/documents/:document_id`, authGuard, async (req, res) => (await getDocumentController()).getDocumentDetails(req, res));
  server.delete(`${prefix}/:project_id/documents/:document_id`, authGuard, async (req, res) => (await getDocumentController()).deleteDocument(req, res));
  server.patch(`${prefix}/:project_id/documents/:document_id`, authGuard, schemaValidator(updateUploadDocumentValidationRules), async (req, res) =>
    (await getDocumentController()).updateDocumentUpload(req, res),
  );
  server.post(`${prefix}/:project_id/documents`, authGuard, schemaValidator(uploadDocumentValidationRules), async (req, res) => (await getDocumentController()).uploadDocument(req, res));
  server.delete(`${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`, authGuard, async (req, res) => (await getDocumentController()).deleteDocumentAttachment(req, res));
  server.patch(`${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`, authGuard, schemaValidator(updateDocumentAttachmentValidationRules), async (req, res) =>
    (await getDocumentController()).updateDocumentAttachment(req, res),
  );

  /**
   * Document Request
   */
  server.post(`${prefix}/:project_id/document-requests`, authGuard, schemaValidator(documentRequestValidationRules), async (req, res) =>
    (await getDocumentController()).createDocumentRequest(req, res),
  );
};
