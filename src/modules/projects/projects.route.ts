import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';
import { updateDocumentAttachmentValidationRules, updateUploadDocumentValidationRules, uploadDocumentValidationRules } from '@/shared/validations/docs';
import { createEventValidationRules, updateEventValidationRules } from '@/shared/validations/event';
import { DocsController } from '../docs/docs.controller';
import { EventController } from '../events/event.controller';
import { ProjectController } from './projects.controller';
import {
  addCustomFieldValidationRules,
  addProjectMemberValidationRules,
  createCommentValidationRules,
  createMilestoneValidationRules,
  createNoteValidationRules,
  createProjectTypeValidationRules,
  // createProjectValidationRules,
  createTaskValidationRules,
  documentRequestValidationRules,
  reorderMilestonesValidationRules,
  toggleNotePinValidationRules,
  updateFieldRequirementValidationRules,
  updateMilestoneValidationRules,
  updateProjectTypeValidationRules,
  // updateProjectValidationRules,
  updateTaskValidationRules,
} from '@/shared/validations/projects';
import { ProjectFormController } from './project_form.controller';
// import { canPerformActionOnProject } from '@/shared/middlewares/project.middleware';

// Lazy controller resolution to avoid circular dependencies
const getDocumentController = () => container.resolve(DocsController);
const getEventsController = () => container.resolve(EventController);
const getProjectController = () => container.resolve(ProjectController);
const getProjectFormController = () => container.resolve(ProjectFormController);

export const projectRoutes = (prefix: string, server: Server) => {
  /**
   * Project Forms
   */
  server.get(`${prefix}/forms`, authGuard, (req, res) => getProjectFormController().getProjectForm(req, res));
  server.post(`${prefix}/forms/fields`, authGuard, schemaValidator(addCustomFieldValidationRules), (req, res) => getProjectFormController().addCustomField(req, res));
  server.patch(`${prefix}/forms/fields/:field_id/requirement`, authGuard, schemaValidator(updateFieldRequirementValidationRules), (req, res) =>
    getProjectFormController().updateFieldRequirement(req, res),
  );
  server.get(`${prefix}/forms/fields`, authGuard, (req, res) => getProjectFormController().getAllFormFields(req, res));

  /**
   * Events
   */
  server.post(`${prefix}/:project_id/events`, authGuard, schemaValidator(createEventValidationRules), (req, res) => getEventsController().createEvent(req, res));
  server.get(`${prefix}/:project_id/events`, authGuard, (req, res) => getEventsController().getAllEvents(req, res));
  server.patch(`${prefix}/:project_id/events/:event_id`, authGuard, schemaValidator(updateEventValidationRules), (req, res) => getEventsController().updateEvent(req, res));
  server.get(`${prefix}/:project_id/events/:event_id`, authGuard, (req, res) => getEventsController().getEventDetails(req, res));
  server.delete(`${prefix}/:project_id/events/:event_id`, authGuard, (req, res) => getEventsController().deleteEvent(req, res));
  // New event invitation response endpoints
  server.post(`${prefix}/:project_id/events/:event_id/accept`, authGuard, (req, res) => getEventsController().acceptEventInvite(req, res));
  server.post(`${prefix}/:project_id/events/:event_id/decline`, authGuard, (req, res) => getEventsController().declineEventInvite(req, res));

  /**
   * Documents
   */
  server.get(`${prefix}/:project_id/documents`, authGuard, (req, res) => getDocumentController().getAllDocuments(req, res));
  server.get(`${prefix}/:project_id/documents/:document_id`, authGuard, (req, res) => getDocumentController().getDocumentDetails(req, res));
  server.delete(`${prefix}/:project_id/documents/:document_id`, authGuard, (req, res) => getDocumentController().deleteDocument(req, res));
  server.patch(`${prefix}/:project_id/documents/:document_id`, authGuard, schemaValidator(updateUploadDocumentValidationRules), (req, res) => getDocumentController().updateDocumentUpload(req, res));
  server.post(`${prefix}/:project_id/documents`, authGuard, schemaValidator(uploadDocumentValidationRules), (req, res) => getDocumentController().uploadDocument(req, res));
  server.delete(`${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`, authGuard, (req, res) => getDocumentController().deleteDocumentAttachment(req, res));
  server.patch(`${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`, authGuard, schemaValidator(updateDocumentAttachmentValidationRules), (req, res) =>
    getDocumentController().updateDocumentAttachment(req, res),
  );

  /**
   * Document Request
   */
  server.post(`${prefix}/:project_id/document-requests`, authGuard, schemaValidator(documentRequestValidationRules), (req, res) => getDocumentController().createDocumentRequest(req, res));

  /**
   * Project Types
   */
  server.get(`${prefix}/types`, authGuard, (req, res) => getProjectController().getAllProjectTypes(req, res));
  server.get(`${prefix}/types/:project_type_id`, authGuard, (req, res) => getProjectController().getProjectTypeDetails(req, res));
  server.post(`${prefix}/types`, authGuard, schemaValidator(createProjectTypeValidationRules), (req, res) => getProjectController().createProjectType(req, res));
  server.patch(`${prefix}/types/:project_type_id`, authGuard, schemaValidator(updateProjectTypeValidationRules), (req, res) => getProjectController().updateProjectTypeDetails(req, res));
  server.delete(`${prefix}/types/:project_type_id`, authGuard, (req, res) => getProjectController().deleteProjectType(req, res));
  server.patch(`${prefix}/types/:project_type_id/milestones/reorder`, authGuard, schemaValidator(reorderMilestonesValidationRules), (req, res) => getProjectController().reorderMilestones(req, res));

  /**
   * Milestones
   */
  server.get(`${prefix}/types/:project_type_id/milestones`, authGuard, (req, res) => getProjectController().getAllMilestones(req, res));
  server.get(`${prefix}/types/:project_type_id/milestones/:milestone_id`, authGuard, (req, res) => getProjectController().getMilestoneDetails(req, res));
  server.post(`${prefix}/types/milestones`, authGuard, schemaValidator(createMilestoneValidationRules), (req, res) => getProjectController().createMilestone(req, res));
  server.patch(`${prefix}/types/milestones/:milestone_id`, authGuard, schemaValidator(updateMilestoneValidationRules), (req, res) => getProjectController().updateMilestone(req, res));
  server.delete(`${prefix}/types/:project_type_id/milestones/:milestone_id`, authGuard, (req, res) => getProjectController().deleteMilestone(req, res));

  /**
   * Project Members
   */
  server.get(`${prefix}/:project_id/members`, authGuard, (req, res) => getProjectController().getProjectMembers(req, res));
  server.post(`${prefix}/:project_id/members`, authGuard, schemaValidator(addProjectMemberValidationRules), (req, res) => getProjectController().addProjectMember(req, res));
  server.delete(`${prefix}/:project_id/members/:member_id`, authGuard, (req, res) => getProjectController().removeProjectMember(req, res));

  /**
   * Tasks
   */
  server.post(`${prefix}/:project_id/tasks`, authGuard, schemaValidator(createTaskValidationRules), (req, res) => getProjectController().createTask(req, res));
  server.get(`${prefix}/tasks`, authGuard, (req, res) => getProjectController().getAllTasks(req, res));
  server.get(`${prefix}/:project_id/tasks/:task_id`, authGuard, (req, res) => getProjectController().getTaskById(req, res));
  server.patch(`${prefix}/:project_id/tasks/:task_id`, authGuard, schemaValidator(updateTaskValidationRules), (req, res) => getProjectController().updateTask(req, res));
  server.delete(`${prefix}/:project_id/tasks/:task_id`, authGuard, (req, res) => getProjectController().deleteTask(req, res));
  server.delete(`${prefix}/:project_id/tasks/:task_id/attachments/:attachment_id`, authGuard, (req, res) => getProjectController().deleteTaskAttachment(req, res));

  /**
   * Notes
   */
  server.post(`${prefix}/:project_id/notes`, authGuard, schemaValidator(createNoteValidationRules), (req, res) => getProjectController().createNote(req, res));
  server.get(`${prefix}/:project_id/notes`, authGuard, (req, res) => getProjectController().getAllNotes(req, res));
  server.get(`${prefix}/:project_id/notes/:note_id`, authGuard, (req, res) => getProjectController().getNoteDetails(req, res));
  server.patch(`${prefix}/:project_id/notes/:note_id/pin-state`, authGuard, schemaValidator(toggleNotePinValidationRules), (req, res) => getProjectController().toggleNotePin(req, res));

  /**
   * Comments
   */
  server.post(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, schemaValidator(createCommentValidationRules), (req, res) => getProjectController().createComment(req, res));
  server.get(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, (req, res) => getProjectController().getNoteComments(req, res));
  server.delete(`${prefix}/:project_id/notes/:note_id/comments/:comment_id`, authGuard, (req, res) => getProjectController().deleteComment(req, res));

  server.get(`${prefix}/metrics`, authGuard, (req, res) => getProjectController().projectMetrics(req, res));
  /**
   * Projects
   */
  server.get(`${prefix}`, authGuard, (req, res) => getProjectController().getAllProjects(req, res));
  server.get(`${prefix}/query`, authGuard, (req, res) => getProjectController().searchProjects(req, res));
  server.get(`${prefix}/:project_id`, authGuard, (req, res) => getProjectController().getProject(req, res));
  server.post(`${prefix}`, authGuard, (req, res) => getProjectController().createProject(req, res));
  server.patch(`${prefix}/:project_id`, authGuard, (req, res) => getProjectController().updateProject(req, res));
};
