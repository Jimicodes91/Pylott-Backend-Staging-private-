import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { ProjectSettingController } from './project_settings.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { toggleProjectSettingsValidationRules } from '@/shared/validations/projects';

const projectSettingController = container.resolve(ProjectSettingController);

export const projectSettingRoutes = (prefix: string, server: Server) => {
  server.patch(`${prefix}/projects`, authGuard, schemaValidator(toggleProjectSettingsValidationRules), projectSettingController.toggleProjectSettings);

  server.get(`${prefix}/projects`, authGuard, projectSettingController.getProjectSettingDetails);
};
