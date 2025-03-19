import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { MetadataController } from './metadata.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { createMetadataValidationRules } from '@/shared/validations/metadata';
import { authenticateUser as authGuard, authorizeRole as authorizationGuard } from '@/shared/middlewares/guard.middleware';
import { UserRoles } from '@/shared/enums';

const metadataController = container.resolve(MetadataController);

export const metadataRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/:project_id/type/documents`, authGuard, metadataController.getDocumentTypes);

  server.get(`${prefix}/:project_id/type/tasks`, authGuard, metadataController.getTaskTypes);

  server.get(`${prefix}/:project_id/type/events`, authGuard, metadataController.getEventTypes);

  server.post(`${prefix}/:project_id/type/documents`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createDocumentType);

  server.post(`${prefix}/:project_id/type/tasks`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createTaskType);

  server.post(`${prefix}/:project_id/type/events`, authGuard, authorizationGuard([UserRoles.ADMIN]), schemaValidator(createMetadataValidationRules), metadataController.createEventType);
};
