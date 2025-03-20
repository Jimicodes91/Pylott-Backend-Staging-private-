import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { UserRoles } from '@/shared/enums';
import { authenticateUser, authorizeRole } from '@/shared/middlewares/guard.middleware';
import { SysAdminController } from './admin.controller';

const sysAdminController = container.resolve(SysAdminController);

export const sysAdminRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/dashboard`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.getDashboardSummary);
  server.get(`${prefix}/companies`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.getAllCompanies);
  server.get(`${prefix}/all`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.getAllUsers);
  server.get(`${prefix}/active`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.getActiveUsers);

  server.get(`${prefix}/companies/:id`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.getCompanyDetails);

  server.patch(`${prefix}/companies/:id/status`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.updateCompanyStatus);
  server.post(`${prefix}/companies/:id/subscribe`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.subscribeCompany);

  server.post(`${prefix}/companies/:id/cancel-subscription`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.cancelSubscription);

  server.post(`${prefix}/companies/:id/renew-subscription`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.renewSubscription);
  server.post(`${prefix}/sysadmins`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.addSysAdmin);

  server.patch(`${prefix}/sysadmins/:id/deactivate`, authenticateUser, authorizeRole([UserRoles.SUPER_ADMIN]), sysAdminController.deactivateSysAdmin);
};
