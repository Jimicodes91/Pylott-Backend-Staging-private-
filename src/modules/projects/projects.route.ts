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
  toggleNotePinValidationRules,
  updateFieldRequirementValidationRules,
  updateMilestoneValidationRules,
  updateProjectTypeValidationRules,
  // updateProjectValidationRules,
  updateTaskValidationRules,
} from '@/shared/validations/projects';
import { ProjectFormController } from './project_form.controller';
// import { canPerformActionOnProject } from '@/shared/middlewares/project.middleware';

const documentController = container.resolve(DocsController);
const eventsController = container.resolve(EventController);
const projectController = container.resolve(ProjectController);
const projectFormController = container.resolve(ProjectFormController);

export const projectRoutes = (prefix: string, server: Server) => {
  /**
   * Project Forms
   */
  server.get(`${prefix}/forms`, authGuard, projectFormController.getProjectForm);
  server.post(`${prefix}/forms/fields`, authGuard, schemaValidator(addCustomFieldValidationRules), projectFormController.addCustomField);
  server.patch(`${prefix}/forms/fields/:field_id/requirement`, authGuard, schemaValidator(updateFieldRequirementValidationRules), projectFormController.updateFieldRequirement);
  server.get(`${prefix}/forms/fields`, authGuard, projectFormController.getAllFormFields);

  /**
   * Events
   */
  server.post(`${prefix}/:project_id/events`, authGuard, schemaValidator(createEventValidationRules), eventsController.createEvent);
  server.get(`${prefix}/:project_id/events`, authGuard, eventsController.getAllEvents);
  server.patch(`${prefix}/:project_id/events/:event_id`, authGuard, schemaValidator(updateEventValidationRules), eventsController.updateEvent);
  server.get(`${prefix}/:project_id/events/:event_id`, authGuard, eventsController.getEventDetails);
  server.delete(`${prefix}/:project_id/events/:event_id`, authGuard, eventsController.deleteEvent);
  // New event invitation response endpoints
  server.post(`${prefix}/:project_id/events/:event_id/accept`, authGuard, eventsController.acceptEventInvite);
  server.post(`${prefix}/:project_id/events/:event_id/decline`, authGuard, eventsController.declineEventInvite);

  /**
   * Documents
   */
  server.get(`${prefix}/:project_id/documents`, authGuard, documentController.getAllDocuments);
  server.get(`${prefix}/:project_id/documents/:document_id`, authGuard, documentController.getDocumentDetails);
  server.delete(`${prefix}/:project_id/documents/:document_id`, authGuard, documentController.deleteDocument);
  server.patch(`${prefix}/:project_id/documents/:document_id`, authGuard, schemaValidator(updateUploadDocumentValidationRules), documentController.updateDocumentUpload);
  server.post(`${prefix}/:project_id/documents`, authGuard, schemaValidator(uploadDocumentValidationRules), documentController.uploadDocument);
  server.delete(`${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`, authGuard, documentController.deleteDocumentAttachment);
  server.patch(
    `${prefix}/:project_id/documents/:document_id/attachments/:attachment_id`,
    authGuard,
    schemaValidator(updateDocumentAttachmentValidationRules),
    documentController.updateDocumentAttachment,
  );

  /**
   * Document Request
   */
  server.post(`${prefix}/:project_id/document-requests`, authGuard, schemaValidator(documentRequestValidationRules), documentController.createDocumentRequest);

  /**
   * Project Types
   */
  server.get(`${prefix}/types`, authGuard, projectController.getAllProjectTypes);
  server.get(`${prefix}/types/:project_type_id`, authGuard, projectController.getProjectTypeDetails);
  server.post(`${prefix}/types`, authGuard, schemaValidator(createProjectTypeValidationRules), projectController.createProjectType);
  server.patch(`${prefix}/types/:project_type_id`, authGuard, schemaValidator(updateProjectTypeValidationRules), projectController.updateProjectTypeDetails);

  /**
   * Milestones
   */
  server.get(`${prefix}/types/:project_type_id/milestones`, authGuard, projectController.getAllMilestones);
  server.get(`${prefix}/types/:project_type_id/milestones/:milestone_id`, authGuard, projectController.getMilestoneDetails);
  server.post(`${prefix}/types/milestones`, authGuard, schemaValidator(createMilestoneValidationRules), projectController.createMilestone);
  server.patch(`${prefix}/types/milestones/:milestone_id`, authGuard, schemaValidator(updateMilestoneValidationRules), projectController.updateMilestone);

  /**
   * Project Members
   */
  server.get(`${prefix}/:project_id/members`, authGuard, projectController.getProjectMembers);
  server.post(`${prefix}/:project_id/members`, authGuard, schemaValidator(addProjectMemberValidationRules), projectController.addProjectMember);
  server.delete(`${prefix}/:project_id/members/:member_id`, authGuard, projectController.removeProjectMember);

  /**
   * Tasks
   */
  server.post(`${prefix}/:project_id/tasks`, authGuard, schemaValidator(createTaskValidationRules), projectController.createTask);
  server.get(`${prefix}/tasks`, authGuard, projectController.getAllTasks);
  server.get(`${prefix}/:project_id/tasks/:task_id`, authGuard, projectController.getTaskById);
  server.patch(`${prefix}/:project_id/tasks/:task_id`, authGuard, schemaValidator(updateTaskValidationRules), projectController.updateTask);
  server.delete(`${prefix}/:project_id/tasks/:task_id`, authGuard, projectController.deleteTask);
  server.delete(`${prefix}/:project_id/tasks/:task_id/attachments/:attachment_id`, authGuard, projectController.deleteTaskAttachment);

  /**
   * Notes
   */
  server.post(`${prefix}/:project_id/notes`, authGuard, schemaValidator(createNoteValidationRules), projectController.createNote);
  server.get(`${prefix}/:project_id/notes`, authGuard, projectController.getAllNotes);
  server.get(`${prefix}/:project_id/notes/:note_id`, authGuard, projectController.getNoteDetails);
  server.patch(`${prefix}/:project_id/notes/:note_id/pin-state`, authGuard, schemaValidator(toggleNotePinValidationRules), projectController.toggleNotePin);

  /**
   * Comments
   */
  server.post(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, schemaValidator(createCommentValidationRules), projectController.createComment);
  server.get(`${prefix}/:project_id/notes/:note_id/comments`, authGuard, projectController.getNoteComments);
  server.delete(`${prefix}/:project_id/notes/:note_id/comments/:comment_id`, authGuard, projectController.deleteComment);

  server.get(`${prefix}/metrics`, authGuard, projectController.projectMetrics);
  /**
   * Projects
   */
  server.get(`${prefix}`, authGuard, projectController.getAllProjects);
  server.get(`${prefix}/query`, authGuard, projectController.searchProjects);
  server.get(`${prefix}/:project_id`, authGuard, projectController.getProject);
  // server.post(`${prefix}`, authGuard, schemaValidator(createProjectValidationRules), projectController.createProject);
  server.post(`${prefix}`, authGuard, projectController.createProject);
  server.patch(`${prefix}/:project_id`, authGuard, projectController.updateProject);
  // server.patch(`${prefix}/:project_id`, authGuard, schemaValidator(updateProjectValidationRules), projectController.updateProject);
};
