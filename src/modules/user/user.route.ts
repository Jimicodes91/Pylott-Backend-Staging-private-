import { container } from 'tsyringe';

import { UserController } from './user.controller';
import { Server } from '@/shared/types/http.type';
import { uploadProfilePicture } from '@/shared/utils/file-upload';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';

const userController = container.resolve(UserController);

export const userRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/:userId`, userController.getUser);
  server.put(`${prefix}/profile/:userId`, uploadProfilePicture.single('pfp'), userController.updateProfile);

  // Multi-company routes
  server.post(`${prefix}/:userId/companies`, authenticateUser, userController.addUserToCompany);
  server.get(`${prefix}/:userId/companies`, userController.getUserCompanies);
  server.delete(`${prefix}/:userId/companies/:companyId`, authenticateUser, userController.removeUserFromCompany);
};
