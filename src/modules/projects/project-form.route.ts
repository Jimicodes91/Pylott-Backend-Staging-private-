import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';

import { addCustomFieldValidationRules, updateFieldRequirementValidationRules } from '@/shared/validations/projects';

// Lazy controller resolution with dynamic imports
const getProjectFormController = async () => {
  const { ProjectFormController } = await import('./project_form.controller');
  return container.resolve(ProjectFormController);
};

export const projectFormRoutes = (prefix: string, server: Server) => {
  /**
   * Project Forms
   */
  server.get(`${prefix}/forms`, authGuard, async (req, res) => (await getProjectFormController()).getProjectForm(req, res));
  server.post(`${prefix}/forms/fields`, authGuard, schemaValidator(addCustomFieldValidationRules), async (req, res) => (await getProjectFormController()).addCustomField(req, res));
  server.patch(`${prefix}/forms/fields/:field_id/requirement`, authGuard, schemaValidator(updateFieldRequirementValidationRules), async (req, res) =>
    (await getProjectFormController()).updateFieldRequirement(req, res),
  );
  server.get(`${prefix}/forms/fields`, authGuard, async (req, res) => (await getProjectFormController()).getAllFormFields(req, res));
};
