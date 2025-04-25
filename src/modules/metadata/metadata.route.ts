import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { MetadataController } from './metadata.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { createMetadataValidationRules } from '@/shared/validations/metadata';
import { authenticateUser as authGuard, authorizeRole as authorizationGuard } from '@/shared/middlewares/guard.middleware';
import { UserRoles } from '@/shared/enums';

const metadataController = container.resolve(MetadataController);

export const metadataRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/type/documents`, authGuard, metadataController.getDocumentTypes);

  server.get(`${prefix}/type/tasks`, authGuard, metadataController.getTaskTypes);

  server.get(`${prefix}/type/events`, authGuard, metadataController.getEventTypes);

  server.get(`${prefix}/type/notes`, authGuard, metadataController.getNoteTypes);

  server.post(`${prefix}/type/documents`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createDocumentType);

  server.post(`${prefix}/type/tasks`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createTaskType);

  server.post(`${prefix}/type/events`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createEventType);

  server.post(`${prefix}/type/notes`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createNoteType);
};
