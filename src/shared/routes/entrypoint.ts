import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { authRoutes } from '@/modules/auth/auth.route';
import { RoutePrefix } from '../enums';
import { companyRoutes } from '@/modules/company/company.route';
import { userRoutes } from '@/modules/user/user.route';

export default (server: Server) => {

  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  authRoutes(`${RoutePrefix.V1}/auth`, server);
  userRoutes(`${RoutePrefix.V1}/user`, server);
  companyRoutes(`${RoutePrefix.V1}/company`, server);
};
