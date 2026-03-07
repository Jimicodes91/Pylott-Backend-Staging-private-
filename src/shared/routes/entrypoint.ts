import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { authRoutes } from '@/modules/auth/auth.route';
import { notificationRoutes } from '@/modules/notifications/notification.routes';
// import { projectRoutes } from '@/modules/projects/projects.route';
import { RoutePrefix } from '../enums';

export default (server: Server) => {
  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  authRoutes(`${RoutePrefix.V1}/auth`, server);
  notificationRoutes(`${RoutePrefix.V1}`, server);
  // projectRoutes(`${RoutePrefix.V1}/projects`, server); // Temporarily disabled - needs further circular dependency investigation
};
