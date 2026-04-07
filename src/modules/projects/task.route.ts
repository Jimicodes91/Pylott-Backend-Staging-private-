import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';
import { createCommentValidationRules } from '@/shared/validations/projects';

// Lazy controller resolution with dynamic imports
const getProjectController = async () => {
  const { ProjectController } = await import('./projects.controller');
  return container.resolve(ProjectController);
};

/**
 * Standalone task routes — no project_id in the URL path.
 * These support standalone tasks where project_id may be null.
 */
export const standaloneTaskRoutes = (prefix: string, server: Server) => {
  console.log(`[STANDALONE TASK ROUTES] Registering routes with prefix: ${prefix}`);
  /**
   * Standalone Task Delete
   */
  server.delete(`${prefix}/:task_id`, authGuard, async (req, res) => (await getProjectController()).deleteStandaloneTask(req, res));

  /**
   * Standalone Task General Update
   */
  server.patch(`${prefix}/:task_id`, authGuard, async (req, res) => (await getProjectController()).updateStandaloneTask(req, res));

  /**
   * Standalone Task Status Update
   */
  server.patch(`${prefix}/:task_id/status`, authGuard, async (req, res) => (await getProjectController()).updateStandaloneTaskStatus(req, res));

  /**
   * Standalone Task Activity Log
   */
  server.get(`${prefix}/:task_id/activity`, authGuard, async (req, res) => (await getProjectController()).getTaskActivity(req, res));

  /**
   * Standalone Task Comments
   */
  server.get(`${prefix}/:task_id/comments`, authGuard, async (req, res) => (await getProjectController()).getStandaloneTaskComments(req, res));
  server.post(`${prefix}/:task_id/comments`, authGuard, schemaValidator(createCommentValidationRules), async (req, res) => (await getProjectController()).createStandaloneTaskComment(req, res));
  server.delete(`${prefix}/:task_id/comments/:comment_id`, authGuard, async (req, res) => (await getProjectController()).deleteStandaloneTaskComment(req, res));
};
