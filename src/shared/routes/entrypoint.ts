import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { authRoutes } from '@/modules/auth/auth.route';
import { RoutePrefix } from '../enums';
import { companyRoutes } from '@/modules/company/company.route';
import { userRoutes } from '@/modules/user/user.route';
import { sysAdminRoutes } from '@/modules/admin/admin.route';
import { auditTrailRoutes } from '@/modules/audit_trail/audit_trail.route';
import { projectSettingRoutes } from '@/modules/project_settings/project_settings.route';
import { projectRoutes } from '@/modules/projects/projects.route';
import { metadataRoutes } from '@/modules/metadata/metadata.route';
import { billingRoutes } from '@/modules/billing/billing.route';

export default (server: Server) => {
  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  authRoutes(`${RoutePrefix.V1}/auth`, server);
  userRoutes(`${RoutePrefix.V1}/user`, server);
  companyRoutes(`${RoutePrefix.V1}/company`, server);
  sysAdminRoutes(`${RoutePrefix.V1}/admin`, server);
  auditTrailRoutes(`${RoutePrefix.V1}/audit-trails`, server);
  projectSettingRoutes(`${RoutePrefix.V1}/settings`, server);
  projectRoutes(`${RoutePrefix.V1}/projects`, server);
  metadataRoutes(`${RoutePrefix.V1}/metadata`, server);
  auditTrailRoutes(`${RoutePrefix.V1}/audit-trail`, server);
  billingRoutes(`${RoutePrefix.V1}/billing`, server);
};
