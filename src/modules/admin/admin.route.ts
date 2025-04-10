import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';
import { SysAdminController } from './admin.controller';

const sysAdminController = container.resolve(SysAdminController);

export const sysAdminRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/dashboard`, authenticateUser, sysAdminController.getDashboardSummary);
  server.get(`${prefix}/companies`, authenticateUser, sysAdminController.getAllCompanies);
  server.get(`${prefix}/all`, authenticateUser, sysAdminController.getAllUsers);
  server.get(`${prefix}/active`, authenticateUser, sysAdminController.getActiveUsers);

  server.get(`${prefix}/companies/:id`, authenticateUser, sysAdminController.getCompanyDetails);
  server.get(`${prefix}/all-admin`, authenticateUser, sysAdminController.getAllAdmins);

  server.patch(`${prefix}/companies/:id/status`, authenticateUser, sysAdminController.updateCompanyStatus);
  server.post(`${prefix}/companies/:id/subscribe`, authenticateUser, sysAdminController.subscribeCompany);

  server.post(`${prefix}/companies/:id/cancel-subscription`, authenticateUser, sysAdminController.cancelSubscription);

  server.post(`${prefix}/companies/:id/renew-subscription`, authenticateUser, sysAdminController.renewSubscription);
  server.post(`${prefix}/sysadmins`, authenticateUser, sysAdminController.addSysAdmin);

  server.patch(`${prefix}/sysadmins/:id/deactivate`, authenticateUser, sysAdminController.deactivateSysAdmin);
};
