import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { Server } from '@/shared/types/http.type';
import { FormsController } from './forms.controller';

const formsController = container.resolve(FormsController);

export const formsRoutes = (prefix: string, server: Server) => {
  // Template CRUD
  server.post(`${prefix}/templates`, authGuard, formsController.createTemplate);
  server.get(`${prefix}/templates`, authGuard, formsController.getTemplates);
  server.get(`${prefix}/templates/:template_id`, authGuard, formsController.getTemplate);
  server.patch(`${prefix}/templates/:template_id`, authGuard, formsController.updateTemplate);
  server.delete(`${prefix}/templates/:template_id`, authGuard, formsController.deleteTemplate);

  // Template actions
  server.post(`${prefix}/templates/:template_id/clone`, authGuard, formsController.cloneTemplate);
  server.post(`${prefix}/templates/:template_id/publish`, authGuard, formsController.publishTemplate);

  // Field CRUD (reorder must come before :field_id to avoid param matching)
  server.patch(`${prefix}/templates/:template_id/fields/reorder`, authGuard, formsController.reorderFields);
  server.post(`${prefix}/templates/:template_id/fields`, authGuard, formsController.createField);
  server.patch(`${prefix}/templates/:template_id/fields/:field_id`, authGuard, formsController.updateField);
  server.delete(`${prefix}/templates/:template_id/fields/:field_id`, authGuard, formsController.deleteField);

  // Versions
  server.get(`${prefix}/templates/:template_id/versions`, authGuard, formsController.getVersions);
  server.get(`${prefix}/templates/:template_id/versions/:version_number`, authGuard, formsController.getVersion);

  // Submissions
  server.post(`${prefix}/submissions`, authGuard, formsController.createSubmission);
  server.get(`${prefix}/submissions/task/:task_id`, authGuard, formsController.getSubmissionsByTask);
  server.patch(`${prefix}/submissions/:submission_id/finalize`, authGuard, formsController.finalizeSubmission);

  // Pre-fill
  server.get(`${prefix}/prefill/:template_id/:client_id`, authGuard, formsController.getPreFillData);
};
