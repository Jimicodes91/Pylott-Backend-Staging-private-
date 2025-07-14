import { container } from 'tsyringe';

import { authenticateUser as authGuard, authorizeRole } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { UserRoles } from '@/shared/enums';
import { AuditTrailController } from './audit_trail.controller';

const auditTrailController = container.resolve(AuditTrailController);

export const auditTrailRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/projects`, authGuard, auditTrailController.getAuditTrail);
  server.get(`${prefix}/all`, authGuard, auditTrailController.getAllActivityLogs);
  server.get(`${prefix}/admin`, authGuard, authorizeRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]), auditTrailController.getAdminActivities);
};
