import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';
import { updateDocumentAttachmentValidationRules, updateUploadDocumentValidationRules, uploadDocumentValidationRules } from '@/shared/validations/docs';
import { createEventValidationRules, updateEventValidationRules } from '@/shared/validations/event';
import { DocsController } from '../docs/docs.controller';
import { EventController } from '../events/event.controller';

const documentController = container.resolve(DocsController);
const eventsController = container.resolve(EventController);
export const projectRoutes = (prefix: string, server: Server) => {
  /**
   * Events
   */

  server.post(`${prefix}/:product_id/events`, authGuard, schemaValidator(createEventValidationRules), eventsController.createEvent);
  server.get(`${prefix}/:product_id/events`, authGuard, eventsController.getAllEvents);
  server.patch(`${prefix}/:product_id/events/:event_id`, authGuard, schemaValidator(updateEventValidationRules), eventsController.updateEvent);
  server.get(`${prefix}/:product_id/events/:event_id`, authGuard, eventsController.getEventDetails);
  server.delete(`${prefix}/:product_id/events/:event_id`, authGuard, eventsController.deleteEvent);
  // New event invitation response endpoints
  server.post(`${prefix}/:product_id/events/:event_id/accept`, authGuard, eventsController.acceptEventInvite);
  server.post(`${prefix}/:product_id/events/:event_id/decline`, authGuard, eventsController.declineEventInvite);

  /**
   * Documents
   */
  server.get(`${prefix}/:product_id/documents`, authGuard, documentController.getAllDocuments);
  server.get(`${prefix}/:product_id/documents/:document_id`, authGuard, documentController.getDocumentDetails);
  server.delete(`${prefix}/:product_id/documents/:document_id`, authGuard, documentController.deleteDocument);
  server.patch(`${prefix}/:product_id/documents/:document_id`, authGuard, schemaValidator(updateUploadDocumentValidationRules), documentController.updateDocumentUpload);
  server.post(`${prefix}/:product_id/documents`, authGuard, schemaValidator(uploadDocumentValidationRules), documentController.uploadDocument);
  server.delete(`${prefix}/:product_id/documents/:document_id/attachments/:attachment_id`, authGuard, documentController.deleteDocumentAttachment);
  server.patch(
    `${prefix}/:product_id/documents/:document_id/attachments/:attachment_id`,
    authGuard,
    schemaValidator(updateDocumentAttachmentValidationRules),
    documentController.updateDocumentAttachment,
  );
  /**
   * Tasks
   */

  /**
   * Comments
   */

  /**
   * Notes
   */
};
