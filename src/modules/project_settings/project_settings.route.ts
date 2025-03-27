import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { ProjectSettingController } from './project_settings.controller';

const projectSettingController = container.resolve(ProjectSettingController);

export const projectSettingRoutes = (prefix: string, server: Server) => {
  server.patch(`${prefix}/projects/:project_id`, authGuard, projectSettingController.toggleProjectSettings);

  server.get(`${prefix}/projects/:project_id`, authGuard, projectSettingController.getProjectSettingDetails);
};
