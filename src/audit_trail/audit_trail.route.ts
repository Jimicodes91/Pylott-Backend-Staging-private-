import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { AuditTrailController } from './audit_trail.controller';

const auditTrailController = container.resolve(AuditTrailController);

export const auditTrailRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/projects/:project_id`, authGuard, auditTrailController.getAuditTrail);
};
