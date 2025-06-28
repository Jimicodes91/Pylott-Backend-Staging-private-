import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';
import { SysAdminController } from './admin.controller';

const sysAdminController = container.resolve(SysAdminController);

export const sysAdminRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/dashboard`, sysAdminController.getDashboardSummary);
  server.get(`${prefix}/companies`, sysAdminController.getAllCompanies);
  server.get(`${prefix}/all`, sysAdminController.getAllUsers);
  server.get(`${prefix}/active`, authenticateUser, sysAdminController.getActiveUsers);

  server.get(`${prefix}/companies/:id`, authenticateUser, sysAdminController.getCompanyDetails);
  server.get(`${prefix}/all-admin`, authenticateUser, sysAdminController.getAllAdmins);

  server.get(`${prefix}/count`, sysAdminController.getTotalCompanies);

  server.get(`${prefix}/count-sub`, sysAdminController.getTotalSubscriptions);

  server.get(`${prefix}/all-sysadmins`, sysAdminController.getAllSysAdmins);

  // In admin.routes.ts
  server.get(`${prefix}/companies/:companyId/users`, authenticateUser, sysAdminController.getCompanyUsers);

  server.patch(`${prefix}/companies/:id/status`, authenticateUser, sysAdminController.updateCompanyStatus);
  server.post(`${prefix}/companies/:id/subscribe`, authenticateUser, sysAdminController.subscribeCompany);

  server.post(`${prefix}/companies/:id/cancel-subscription`, authenticateUser, sysAdminController.cancelSubscription);

  server.post(`${prefix}/companies/:id/renew-subscription`, authenticateUser, sysAdminController.renewSubscription);
  server.post(`${prefix}/sysadmins`, authenticateUser, sysAdminController.addSysAdmin);

  server.patch(`${prefix}/sysadmins/:id/deactivate`, authenticateUser, sysAdminController.deactivateSysAdmin);
  // In admin.routes.ts
  server.patch(`${prefix}/users/:id/status`, authenticateUser, sysAdminController.updateUserStatus);
};
