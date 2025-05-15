import { container } from 'tsyringe';
import { Server } from '@/shared/types/http.type';

import { authenticateUser } from '@/shared/middlewares/guard.middleware';
import { ClientController } from './clients.controller';

const clientController = container.resolve(ClientController);

export const clientRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/:id/details`, authenticateUser, clientController.getClientDetails);
  server.get(`${prefix}/top/:companyId`, authenticateUser, clientController.getTopClients);
  server.get(`${prefix}/:id`, authenticateUser, clientController.getClientById);
};
