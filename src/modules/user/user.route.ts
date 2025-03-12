import { container } from 'tsyringe';

import { UserController } from './user.controller';
import { Server } from '@/shared/types/http.type';

const userController = container.resolve(UserController);

export const userRoutes = (prefix: string, server: Server) => {
	server.get(`${prefix}/:userId`, authenticateUser, userController.getUser);
	server.put(`${prefix}/profile/:userId`, authenticateUser, userController.updateProfile);
};
