import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { authRoutes } from '@/modules/auth/auth.route';
import { RoutePrefix } from '../enums';

export default (server: Server) => {
  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  authRoutes(`${RoutePrefix.V1}/auth`, server);
};
