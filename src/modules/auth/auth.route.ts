import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { AuthController } from './auth.controller';

const authController = container.resolve(AuthController);

export const authRoutes = (prefix: string, server: Server) => {};
