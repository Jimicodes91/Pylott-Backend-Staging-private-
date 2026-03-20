import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';

import {
  addProjectMemberValidationRules,
  createCommentValidationRules,
  createMilestoneValidationRules,
  createNoteValidationRules,
  createProjectTypeValidationRules,
  createTaskValidationRules,
  reorderMilestonesValidationRules,
  toggleNotePinValidationRules,
  updateMilestoneValidationRules,
  updateProjectTypeValidationRules,
  updateTaskValidationRules,
} from '@/shared/validations/projects';

// Lazy controller resolution with dynamic imports
const getProjectController = async () => {
  const { ProjectController } = await import('./projects.controller');
  return container.resolve(ProjectController);
};

export const projectCoreRoutes = (prefix: string, server: Server) => {
  /**
   * Project Types
   */
  server.get(`${prefix}/types`, authGuard, async (req, res) => (await getProjectController()).getAllProjectTypes(req, res));
  server.get(`${prefix}/types/templates`, authGuard, async (req, res) => (await getProjectController()).getJourneyTemplates(req, res));
  server.get(`${prefix}/types/:project_type_id`, authGuard, async (req, res) => (await getProjectController()).getProjectTypeDetails(req, res));
  server.post(`${prefix}/types`, authGuard, schemaValidator(createProjectTypeValidationRules), async (req, res) => (await getProjectController()).createProjectType(req, res));
  server.patch(`${prefix}/types/:project_type_id`, authGuard, schemaValidator(updateProjectTypeValidationRules), async (req, res) => (await getProjectController()).updateProjectTypeDetails(req, res));
  server.delete(`${prefix}/types/:project_type_id`, authGuard, async (req, res) => (await getProjectController()).deleteProjectType(req, res));
  server.patch(`${prefix}/types/:project_type_id/milestones/reorder`, authGuard, schemaValidator(reorderMilestonesValidationRules), async (req, res) =>
    (await getProjectController()).reorderMilestones(req, res),
  );

  /**
   * Milestones
   */
  server.get(`${prefix}/types/:project_type_id/milestones`, authGuard, async (req, res) => (await getProjectController()).getAllMilestones(req, res));
  server.get(`${prefix}/types/:project_type_id/milestones/:milestone_id`, authGuard, async (req, res) => (await getProjectController()).getMilestoneDetails(req, res));
  server.post(`${prefix}/types/milestones`, authGuard, schemaValidator(createMilestoneValidationRules), async (req, res) => (await getProjectController()).createMilestone(req, res));
  server.patch(`${prefix}/types/milestones/:milestone_id`, authGuard, schemaValidator(updateMilestoneValidationRules), async (req, res) => (await getProjectController()).updateMilestone(req, res));
  server.delete(`${prefix}/types/:project_type_id/milestones/:milestone_id`, authGuard, async (req, res) => (await getProjectController()).deleteMilestone(req, res));

  /**
   * Project Members
   */
  server.get(`${prefix}/:project_id/available-assignees`, authGuard, async (req, res) => (await getProjectController()).getAvailableAssignees(req, res));
  server.get(`${prefix}/:project_id/members`, authGuard, async (req, res) => (await getProjectController()).getProjectMembers(req, res));
  server.post(`${prefix}/:project_id/members`, authGuard, schemaValidator(addProjectMemberValidationRules), async (req, res) => (await getProjectController()).addProjectMember(req, res));
  server.delete(`${prefix}/:project_id/members/:member_id`, authGuard, async (req, res) => (await getProjectController()).removeProjectMember(req, res));

  /**
   * Tasks
   */
  server.post(`${prefix}/:project_id/tasks`, authGuard, schemaValidator(createTaskValidationRules), async (req, res) => (await getProjectController()).createTask(req, res));
  server.get(`${prefix}/tasks`, authGuard, async (req, res) => (await getProjectController()).getAllTasks(req, res));
  server.get(`${prefix}/:project_id/tasks/:task_id`, authGuard, async (req, res) => (await getProjectController()).getTaskById(req, res));
  server.patch(`${prefix}/:project_id/tasks/:task_id`, authGuard, schemaValidator(updateTaskValidationRules), async (req, res) => (await getProjectController()).updateTask(req, res));
  server.delete(`${prefix}/:project_id/tasks/:task_id`, authGuard, async (req, res) => (await getProjectController()).deleteTask(req, res));
  server.delete(`${prefix}/:project_id/tasks/:task_id/attachments/:attachment_id`, authGuard, async (req, res) => (await getProjectController()).deleteTaskAttachment(req, res));

  /**
   * Notes
   */
  server.post(`${prefix}/:project_id/notes`, authGuard, schemaValidator(createNoteValidationRules), async (req, res) => (await getProjectController()).createNote(req, res));
  server.get(`${prefix}/:project_id/notes`, authGuard, async (req, res) => (await getProjectController()).getAllNotes(req, res));
  server.get(`${prefix}/:project_id/notes/:note_id`, authGuard, async (req, res) => (await getProjectController()).getNoteDetails(req, res));
  server.patch(`${prefix}/:project_id/notes/:note_id/pin-state`, authGuard, schemaValidator(toggleNotePinValidationRules), async (req, res) => (await getProjectController()).toggleNotePin(req, res));

  /**
   * Comments
   */
  server.post(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, schemaValidator(createCommentValidationRules), async (req, res) => (await getProjectController()).createComment(req, res));
  server.get(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, async (req, res) => (await getProjectController()).getNoteComments(req, res));
  server.delete(`${prefix}/:project_id/notes/:note_id/comments/:comment_id`, authGuard, async (req, res) => (await getProjectController()).deleteComment(req, res));

  server.get(`${prefix}/metrics`, authGuard, async (req, res) => (await getProjectController()).projectMetrics(req, res));
  /**
   * Projects
   */
  server.get(`${prefix}`, authGuard, async (req, res) => (await getProjectController()).getAllProjects(req, res));
  server.get(`${prefix}/query`, authGuard, async (req, res) => (await getProjectController()).searchProjects(req, res));
  server.get(`${prefix}/:project_id`, authGuard, async (req, res) => (await getProjectController()).getProject(req, res));
  server.post(`${prefix}`, authGuard, async (req, res) => (await getProjectController()).createProject(req, res));
  server.patch(`${prefix}/:project_id`, authGuard, async (req, res) => (await getProjectController()).updateProject(req, res));
};
