import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { DocsController } from '../docs/docs.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { EventController } from '../events/event.controller';
import { createEventValidationRules } from '@/shared/validations/event';
import { uploadDocumentValidationRules } from '@/shared/validations/docs';

const documentController = container.resolve(DocsController);
const eventsController = container.resolve(EventController);
export const projectRoutes = (prefix: string, server: Server) => {
  /**
   * Projects
   */

  /**
   * Events
   */

  server.post(`${prefix}/:product_id/events`, authGuard, schemaValidator(createEventValidationRules), eventsController.createEvent);
  server.get(`${prefix}/:product_id/events`, authGuard, eventsController.getAllEvents);
  server.get(`${prefix}/:product_id/events/:event_id`, authGuard, eventsController.getEventDetails);

  /**
   * Documents
   */
  server.get(`${prefix}/:product_id/documents`, authGuard, documentController.getAllDocuments);
  server.get(`${prefix}/:product_id/documents/:document_id`, authGuard, documentController.getDocumentDetails);
  server.post(`${prefix}/:product_id/documents/upload`, authGuard, schemaValidator(uploadDocumentValidationRules), documentController.uploadDocument);

  /**
   * Activity Logs
   */

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
