import { container } from 'tsyringe';

import { authenticateUser as authGuard, authorizeRole } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { UserRoles } from '@/shared/enums';
import { NativeformsController } from './nativeforms.controller';

const nativeformsController = container.resolve(NativeformsController);

export const nativeformsRoutes = (prefix: string, server: Server) => {
  // ─── Form Link CRUD (Admin-only) ─────────────────────────────────
  server.get(`${prefix}/form-links`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), nativeformsController.getFormLinks);

  // Client-facing: get form links by project (must come BEFORE /:id)
  server.get(`${prefix}/form-links/project/:projectId`, authGuard, nativeformsController.getFormLinksByProject);

  server.get(`${prefix}/form-links/:id`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), nativeformsController.getFormLink);

  server.post(`${prefix}/form-links`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), nativeformsController.createFormLink);

  server.patch(`${prefix}/form-links/:id`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), nativeformsController.updateFormLink);

  server.delete(`${prefix}/form-links/:id`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), nativeformsController.deleteFormLink);

  // ─── Client-facing Endpoints ─────────────────────────────────────
  server.get(`${prefix}/submissions/project/:projectId`, authGuard, nativeformsController.getSubmissionsByProject);

  server.get(`${prefix}/submissions/check/:formLinkId/:projectId`, authGuard, nativeformsController.checkSubmission);
};

/**
 * Webhook route — registered separately without auth guard.
 * Rate limiting should be configured at the infrastructure level or via express-rate-limit.
 */
export const nativeformsWebhookRoutes = (prefix: string, server: Server) => {
  server.post(`${prefix}/nativeforms`, nativeformsController.handleWebhook as any);
};
