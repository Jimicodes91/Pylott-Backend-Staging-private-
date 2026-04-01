import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import Objection from 'objection';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import {
  DocumentAttachmentsRepository,
  DocumentsRepository,
  MetadataRepository,
  ProjectFormFieldRepository,
  ProjectFormsRepository,
  ProjectRepository,
  ProjectSettingsRepository,
  ProjectTaskAssigneesRepository,
  ProjectTaskRepository,
  ProjectTypeRepository,
  UserRepository,
} from '@/repositories';

import { Attachments } from '@/models/document_attachments.model';
import { Documents } from '@/models/documents.model';
import { ProjectTaskAssignees } from '@/models/project_task_asignees.model';
import { ProjectTask } from '@/models/project_task.model';
import { User, UserModelType } from '@/models/user.model';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';
import { StatusTransitionValidator } from '@/modules/projects/services/status-transition.service';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory, EmailSubject, MetadataType, ProjectTaskStatus, TaskActivityAction, UserRoles } from '@/shared/enums';
import { TaskActivityLog } from '@/models/task_activity_log.model';
import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { CreateTask } from '@/shared/types/projects.type';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { newTaskAssignedEmail, taskCompletedEmail } from '@/shared/utils/email';
import sendEmail from '@/shared/utils/nodemailer';
import { ContactRespository } from '@/repositories/contact.repository';
import { FRONTEND_URL } from '@/config/env';
import { notificationEmitter } from '@/shared/events/notification.events';

@injectable()
export class TaskService {
  private traceId = '[Task Service]';

  constructor(
    private readonly cloudinary: Cloudinary,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly documentRepository: DocumentsRepository,
    private readonly contactRepository: ContactRespository,
    private readonly projectTaskRepository: ProjectTaskRepository,
    private readonly projectFormRepository: ProjectFormsRepository,
    private readonly projectFormFieldRepository: ProjectFormFieldRepository,
    private readonly projectTaskAssigneesRepository: ProjectTaskAssigneesRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
    private readonly attachmentRepository: DocumentAttachmentsRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly statusTransitionValidator: StatusTransitionValidator,
  ) {}

  async createTask(user: UserModelType, project_id: string, payload: CreateTask): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const project = await this.projectRepository.findOne({ id: project_id, company_id, deleted_at: null });
      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.task_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.TASK,
          id: payload.task_type_id,
          deleted_at: null,
        };

        const taskType = await this.metadataRepository.findOne(metadataQuery);

        if (!taskType) return { status: false, message: 'Task type not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const projectType = await this.projectTypeRepository.findOne({
        id: payload.project_type_id,
        company_id,
      });

      if (!projectType) {
        return {
          status: false,
          message: 'Invalid project type (pipeline)',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const task_id = uuidv4();
      const document_id = uuidv4();

      const assigneePayload: Array<Partial<ProjectTaskAssignees>> = [];

      if (payload.assignees && payload.assignees.length) {
        for (const assignee_id of payload.assignees) {
          const assignee = await this.userRepository.findOne({ id: assignee_id, deleted_at: null });
          if (!assignee) {
            return {
              status: false,
              message: 'Assignee not found',
              statusCode: StatusCodes.NOT_FOUND,
            };
          }

          assigneePayload.push({ company_id, assignee_id, project_id, task_id });
        }
      }

      const existingTask = await this.projectTaskRepository.findOne({ project_id, name: payload.name, deleted_at: null });

      if (existingTask) {
        return {
          status: false,
          message: 'Task name already exists in this project',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }
      await Objection.Model.transaction(async (trx) => {
        const projectTaskData: Partial<ProjectTask> = {
          id: task_id,
          project_id,
          company_id,
          name: payload.name,
          description: payload?.description ?? '',
          status: (payload?.status as ProjectTaskStatus) || ProjectTaskStatus.DRAFT,
          due_date: dayjs(payload.due_date).format(),
          is_visible_to_client: payload.is_visible_to_client,
          author_id: user.id,
          task_type_id: payload?.task_type_id ?? null,
          project_type_id: payload.project_type_id,
          task_category_type: payload?.task_category_type ?? null,
          form_config: payload?.form_config ?? null,
          signing_status: payload?.task_category_type === 'signing' ? 'sent' : null,
        };

        const documentData: Partial<Documents> = {
          id: document_id,
          company_id,
          project_id,
          task_id,
          type: MetadataType.TASK,
          name: payload.name,
          is_visible_to_client: payload.is_visible_to_client,
        };

        const documentAttachmentData: Partial<Attachments> = {
          document_id,
        };

        await this.projectTaskRepository.create(projectTaskData, trx);
        await this.documentRepository.create(documentData, trx);
        await this.projectTaskAssigneesRepository.createMultiple(assigneePayload, trx);

        if (payload.attachments && payload.attachments.length) {
          await payload.attachments.forEach(async (fileData) => {
            if (!fileData.includes('http')) {
              const fileName = `${project_id}/${payload.name.replace(' ', '_').toLowerCase()}`;
              const { data } = await this.cloudinary.upload(DocumentsDirectory.TASKS, fileData, fileName);
              if (data) await this.attachmentRepository.create({ ...documentAttachmentData, media_url: data });
            } else {
              await this.attachmentRepository.create({ ...documentAttachmentData, media_url: fileData });
            }
          });
        }
      });

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.TASK_ADDED,
        {
          user_id: user.id,
          company_id,
          description: 'Task added',
          entity_description: user?.name?.length ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id,
          entity_id: task_id,
        },
        project_id,
      );

      for (const assignee_id of payload.assignees ?? []) {
        const emailSubject = `${EmailSubject.TASK_ASSIGNED} - ${payload.name}`;
        const taskAuthor = await this.userRepository.findOne({ id: assignee_id });
        const taskLink = `${FRONTEND_URL}/projects/${project_id}/tasks/${task_id}`;
        const formattedDueDate = payload.due_date ? dayjs(payload.due_date).format('MMMM DD, YYYY') : 'Not set';
        const email = newTaskAssignedEmail(taskAuthor.name, payload.name, project.name, formattedDueDate, taskLink);
        await sendEmail(taskAuthor.email, emailSubject, email);

        // Emit notification event for task assignment
        notificationEmitter.emitNotification({
          user_id: assignee_id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to task "${payload.name}" in project "${project.name}"`,
          data: {
            task_id,
            project_id,
            task_name: payload.name,
            project_name: project.name,
            due_date: payload.due_date,
            task_link: taskLink,
          },
        });
      }

      return {
        status: true,
        message: 'Task created successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred creating task ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async updateTask(user: UserModelType, task_id: string, project_id: string, payload: Partial<CreateTask>): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const updateData: Partial<ProjectTask> = { description: payload?.description };

      const task = await this.projectTaskRepository.getTaskById(company_id, project_id, task_id);
      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const project = await this.projectRepository.findOne({ id: project_id, company_id, deleted_at: null });
      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.task_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.TASK,
          id: payload.task_type_id,
          deleted_at: null,
        };

        const taskType = await this.metadataRepository.findOne(metadataQuery);

        if (!taskType) return { status: false, message: 'Task type not found', statusCode: StatusCodes.NOT_FOUND };
        updateData.task_type_id = payload.task_type_id;
      }

      if (payload.project_type_id) {
        const projectType = await this.projectTypeRepository.findOne({
          id: payload.project_type_id,
          company_id,
        });

        if (!projectType) {
          return {
            status: false,
            message: 'Invalid project type (pipeline)',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
        updateData.project_type_id = payload.project_type_id;
      }

      if (payload.assignees && payload.assignees.length) {
        await this.updateTaskAssignees({
          company_id,
          project_id,
          task_id,
          current_assignees: task.assignees,
          new_assignees: payload.assignees,
        });
      }

      if (payload.name) {
        const existingTask = await this.projectTaskRepository.getTaskWhereName(project_id, payload.name, task_id);
        if (existingTask) {
          return {
            status: false,
            message: 'Task name already exists in this project',
          };
        }
        updateData.name = payload.name;
      }

      if (payload.due_date) updateData.due_date = dayjs(payload.due_date).format();
      if (payload.is_visible_to_client !== null || payload.is_visible_to_client !== undefined) updateData.is_visible_to_client = payload.is_visible_to_client;

      // Validate status transition before persisting
      const previousStatus = this.normalizeTaskStatus(task.status);
      if (payload.status) {
        const transitionResult = this.statusTransitionValidator.validateTransition(previousStatus, payload.status);
        if (!transitionResult.status) {
          return transitionResult;
        }

        // Enforce admin-only unarchive (archived → completed)
        if (previousStatus === ProjectTaskStatus.ARCHIVED && payload.status === ProjectTaskStatus.COMPLETED) {
          const userRole = user.role?.toLowerCase();
          if (userRole !== UserRoles.ADMIN && userRole !== UserRoles.SUPER_ADMIN) {
            return {
              status: false,
              message: 'Only ADMIN or SUPER_ADMIN users can unarchive tasks',
              statusCode: StatusCodes.FORBIDDEN,
            };
          }
        }

        updateData.status = payload.status as ProjectTaskStatus;
      }

      await Objection.Model.transaction(async (trx) => {
        await this.projectTaskRepository.update({ id: task_id, company_id }, updateData, trx);

        if (payload.attachments && payload.attachments.length) {
          const document = await this.documentRepository.findOne({ task_id }, trx);
          if (document) {
            const documentAttachmentData: Partial<Attachments> = {
              document_id: document.id,
            };

            await payload.attachments.forEach(async (fileData) => {
              if (!fileData.includes('http')) {
                const fileName = `${project_id}/${payload.name.replace(' ', '_').toLowerCase()}`;
                const { data } = await this.cloudinary.upload(DocumentsDirectory.TASKS, fileData, fileName);
                if (data) await this.attachmentRepository.create({ ...documentAttachmentData, media_url: data }, trx);
              }
            });
          }
        }
      });

      // Log status change to activity log and emit notification
      if (payload.status && payload.status !== previousStatus) {
        try {
          await TaskActivityLog.query().insert({
            id: uuidv4(),
            task_id,
            action: TaskActivityAction.STATUS_CHANGED,
            previous_value: previousStatus,
            new_value: payload.status,
            user_id: user.id,
            company_id: user.company_id,
            metadata: JSON.stringify({ task_name: task.name, project_id }),
          });
        } catch (logError) {
          console.log(`${this.traceId} Non-blocking: failed to log activity ===> ${(logError as Error)?.message}`);
        }

        // Emit notification for status change
        const taskLink = `${FRONTEND_URL}/projects/${project_id}/tasks/${task_id}`;
        notificationEmitter.emitNotification({
          user_id: task.author_id,
          type: 'task_status_changed',
          title: 'Task Status Updated',
          message: `Task "${task.name}" status changed from "${previousStatus}" to "${payload.status}"`,
          data: {
            task_id,
            project_id,
            task_name: task.name,
            previous_status: previousStatus,
            new_status: payload.status,
            task_link: taskLink,
          },
        });
      }

      if (payload.status && payload.status === ProjectTaskStatus.COMPLETED) {
        const emailSubject = `${EmailSubject.TASK_COMPLETED} - ${task.name}`;
        const taskAuthor = await this.userRepository.findOne({ id: task.author_id });
        const taskLink = `${FRONTEND_URL}/projects/${project_id}/tasks/${task_id}`;
        const email = taskCompletedEmail(taskAuthor.name, task.name, taskLink);
        await sendEmail(taskAuthor.email, emailSubject, email);

        // Emit notification event for task completion
        notificationEmitter.emitNotification({
          user_id: task.author_id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `Task "${task.name}" has been marked as completed`,
          data: {
            task_id,
            project_id,
            task_name: task.name,
            project_name: project.name,
            task_link: taskLink,
          },
        });
      }

      if (payload.assignees && payload.assignees.length) {
        for (const assignee_id of payload.assignees ?? []) {
          const emailSubject = `${EmailSubject.TASK_ASSIGNED} - ${payload.name || task.name}`;
          const taskAuthor = await this.userRepository.findOne({ id: assignee_id });
          const taskLink = `${FRONTEND_URL}/projects/${project_id}/tasks/${task_id}`;
          const dueDate = payload.due_date || task.due_date;
          const formattedDueDate = dueDate ? dayjs(dueDate).format('MMMM DD, YYYY') : 'Not set';
          const email = newTaskAssignedEmail(taskAuthor.name, payload.name || task.name, project.name, formattedDueDate, taskLink);
          await sendEmail(taskAuthor.email, emailSubject, email);

          // Emit notification event for task assignment update
          notificationEmitter.emitNotification({
            user_id: assignee_id,
            type: 'task_assigned',
            title: 'Task Assignment Updated',
            message: `You have been assigned to task "${payload.name || task.name}" in project "${project.name}"`,
            data: {
              task_id,
              project_id,
              task_name: payload.name || task.name,
              project_name: project.name,
              due_date: dueDate,
              task_link: taskLink,
            },
          });
        }
      }

      return {
        status: true,
        message: 'Task updated successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred updating task ===> ${JSON.stringify({
          task_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getTaskById(user: UserModelType, company_id: string, project_id: string, task_id: string): Promise<ServiceType> {
    try {
      const task = await this.projectTaskRepository.getTaskDetails(company_id, project_id, task_id);

      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      // Inhouse tasks are not visible to clients (requirement #11)
      const isClient = user.role?.toLowerCase() === 'client';
      if (isClient && !task.is_visible_to_client) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      task.due_date = dayjs(task.due_date).format('DD MMM, YYYY');
      task['assignees'] = task.assignees.map((assignee) => assignee.user).flat() as any;
      task.status = this.normalizeTaskStatus(task.status);

      const today = dayjs().startOf('day');
      const dueDate = dayjs(task.due_date).startOf('day');

      const isOverdue = task.status !== ProjectTaskStatus.COMPLETED && dueDate.isBefore(today);

      return {
        status: true,
        message: 'Task retrieved successfully',
        data: { ...task, is_overdue: isOverdue },
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred retrieving task ===> ${JSON.stringify({
          task_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getAllTask(user: UserModelType, project_id: string | null, query: ObjectLiteral = {}): Promise<ServiceType> {
    const company_id = user.company_id;
    try {
      const isClient = user.role.toLowerCase() === 'client';

      // Parse visibility filter from query string (e.g. ?is_visible_to_client=false for Inhouse)
      if (typeof query.is_visible_to_client === 'string') {
        query.is_visible_to_client = query.is_visible_to_client === 'true';
      }

      if (isClient) {
        query.is_visible_to_client = true;
        query.assignee_id = user.id;
      }

      const projectSettings = await this.projectSettingsRepository.getOne({ company_id, deleted_at: null });
      // Only apply project-level default when no explicit Inhouse/Client filter was provided
      if (!isClient && (query.is_visible_to_client === undefined || query.is_visible_to_client === null)) {
        query['is_visible_to_client'] = projectSettings?.client_can_view_task ?? query.is_visible_to_client;
      }

      // Status filter: exclude archived by default unless explicitly requested
      if (query.status) {
        query['status_filter'] = query.status;
        delete query.status;
      } else if (query.include_archived === 'true' || query.include_archived === true) {
        // No status filter, but include archived — don't exclude anything
      } else {
        query['exclude_archived'] = true;
      }
      delete query.include_archived;

      // Task category type filter
      if (query.task_category_type) {
        query['task_category_type_filter'] = query.task_category_type;
        delete query.task_category_type;
      }

      const tasks = await this.projectTaskRepository.getAllTasks(company_id, project_id, query);

      const remappedTasks = await Promise.all(
        tasks.map(async (taskData) => {
          const { project_id, ...task } = taskData;

          task.status = this.normalizeTaskStatus(task.status);

          const today = dayjs().startOf('day');

          const dueDate = dayjs(task.due_date).startOf('day');

          const isOverdue = task.status !== ProjectTaskStatus.COMPLETED && dueDate.isBefore(today);

          const projectClientsData = await this.getProjectClients(company_id, project_id);

          return {
            ...task,
            due_date: dayjs(task.due_date).format('DD MMM, YYYY'),
            assignees: task.assignees.map((assignee) => assignee.user).flat(),
            is_over_due: isOverdue,
            project_id,
            project: projectClientsData,
          };
        }),
      );

      return {
        status: true,
        message: 'Task retrieved successfully',
        data: remappedTasks,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred retrieving task ===> ${JSON.stringify({
          company_id,
          project_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  /** Count of incomplete tasks assigned to the current user (for sidebar badge / task notification). */
  async getMyAssignedIncompleteTaskCount(user: UserModelType): Promise<ServiceType> {
    try {
      const count = await this.projectTaskRepository.getIncompleteCountAssignedToUser(user.company_id, user.id);
      return {
        status: true,
        message: 'Count retrieved successfully',
        data: { count },
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred getting assigned task count ===> ${JSON.stringify({ user_id: user.id, err_msg: (error as Error)?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: { count: 0 },
      };
    }
  }

  async deleteTask(project_id: string, task_id: string): Promise<ServiceType> {
    try {
      await Objection.Model.transaction(async (trx) => {
        await this.projectTaskRepository.delete({ project_id, id: task_id }, false, trx);
        await this.projectTaskAssigneesRepository.delete({ task_id, project_id, deleted_at: null }, false, trx);
        const document = await this.documentRepository.findOne({ task_id, deleted_at: null });
        if (document) {
          await this.attachmentRepository.delete({ document_id: document.id, deleted_at: null }, false, trx);
          await this.documentRepository.delete({ id: document.id }, false, trx);
        }
      });

      return {
        status: true,
        message: 'Task deleted successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred deleting task ===> ${JSON.stringify({
          project_id,
          task_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async deleteTaskAttachment(user: UserModelType, task_id: string, attachment_id: string): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const task = await this.projectTaskRepository.findOne({ id: task_id, company_id, deleted_at: null });
      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const document = await this.documentRepository.findOne({ task_id, deleted_at: null });
      if (!document) {
        return {
          status: false,
          message: 'Document not found for this task',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const attachment = await this.attachmentRepository.findOne({ id: attachment_id, document_id: document.id, deleted_at: null });
      if (!attachment) {
        return {
          status: false,
          message: 'Attachment not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      await this.attachmentRepository.delete({ id: attachment_id });

      return {
        status: true,
        message: 'Task attachment deleted successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred deleting attachment ===> ${JSON.stringify({
          task_id,
          attachment_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  /**
   * Update the signing sub-status for a signing task.
   * Validates the task is a signing task and the transition is valid.
   * On 'signed', creates a document record linked to both task and project.
   */
  async updateSigningStatus(user: UserModelType, task_id: string, project_id: string, targetStatus: string): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const task = await this.projectTaskRepository.getTaskById(company_id, project_id, task_id);
      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (task.task_category_type !== 'signing') {
        return {
          status: false,
          message: 'This operation is only valid for signing tasks',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const currentSigningStatus = task.signing_status || 'sent';
      const transitionResult = this.statusTransitionValidator.validateSigningTransition(currentSigningStatus, targetStatus);
      if (!transitionResult.status) {
        return transitionResult;
      }

      await this.projectTaskRepository.update({ id: task_id, company_id }, { signing_status: targetStatus } as any);

      // If transitioning to 'signed', create a document record linked to both task and project
      if (targetStatus === 'signed') {
        try {
          await this.documentRepository.create({
            id: uuidv4(),
            company_id,
            project_id,
            task_id,
            type: MetadataType.TASK,
            name: `Signed Document - ${task.name}`,
            is_visible_to_client: task.is_visible_to_client ?? true,
          } as any);
        } catch (docError) {
          console.log(`${this.traceId} Non-blocking: failed to create signed document record ===> ${(docError as Error)?.message}`);
        }
      }

      // Log activity
      try {
        await TaskActivityLog.query().insert({
          id: uuidv4(),
          task_id,
          action: TaskActivityAction.SIGNING_STATUS_CHANGED,
          previous_value: currentSigningStatus,
          new_value: targetStatus,
          user_id: user.id,
          company_id,
          metadata: JSON.stringify({ task_name: task.name, project_id }),
        });
      } catch (logError) {
        console.log(`${this.traceId} Non-blocking: failed to log signing activity ===> ${(logError as Error)?.message}`);
      }

      // Emit notification to task author
      const taskLink = `${FRONTEND_URL}/projects/${project_id}/tasks/${task_id}`;
      notificationEmitter.emitNotification({
        user_id: task.author_id,
        type: 'signing_status_changed',
        title: 'Signing Status Updated',
        message: `Signing status for task "${task.name}" changed from "${currentSigningStatus}" to "${targetStatus}"`,
        data: {
          task_id,
          project_id,
          task_name: task.name,
          previous_signing_status: currentSigningStatus,
          new_signing_status: targetStatus,
          task_link: taskLink,
        },
      });

      return {
        status: true,
        message: 'Signing status updated successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred updating signing status ===> ${JSON.stringify({
          task_id,
          err_msg: (error as Error)?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  /**
   * Map legacy 'pending' status to 'sent' at the application layer.
   * All other values pass through unchanged.
   */
  private normalizeTaskStatus(status: string): string {
    if (status === 'pending') return 'sent';
    return status;
  }

  private async updateTaskAssignees(payload: { task_id: string; project_id: string; company_id: string; current_assignees: ProjectTaskAssignees[]; new_assignees: string[] }): Promise<void> {
    const { company_id, current_assignees, new_assignees, project_id, task_id } = payload;

    const currentAssigneeIds = current_assignees.map((a) => a.assignee_id);

    const assigneesToAdd = new_assignees.filter((id) => !currentAssigneeIds.includes(id));

    const assigneesToRemove = currentAssigneeIds.filter((id) => !new_assignees.includes(id));

    if (assigneesToAdd.length > 0) {
      const assignees = assigneesToAdd.map((assigneeId) => ({
        project_id: project_id,
        company_id: company_id,
        task_id: task_id,
        assignee_id: assigneeId,
      }));
      await this.projectTaskAssigneesRepository.createMultiple(assignees);
    }

    if (assigneesToRemove.length > 0) {
      await this.projectTaskAssigneesRepository.query().where('task_id', task_id).whereIn('assignee_id', assigneesToRemove).delete();
    }
  }

  private async getProjectClients(company_id: string, project_id: string) {
    let projectClients = {};

    if (!project_id) return projectClients;

    const project = await this.projectRepository.getProjectDetails(company_id, project_id);

    const form = await this.projectFormRepository.getCompanyForm(company_id);

    const formFields = form ? await this.projectFormFieldRepository.findMany({ form_id: form.id }) : [];

    for (const formField of formFields) {
      const formSlug = formField.slug;

      if (formField.slug === 'project_client' && project.form_data?.[formSlug] && Array.isArray(project.form_data?.[formSlug])) {
        projectClients = await this.contactRepository.getClientsWhereIn(project.form_data?.[formSlug]);
      }
    }

    const company = project.form_data['client_organization'] ?? '';

    return { id: project_id, name: project.name, clients: projectClients, client_organization: company };
  }
}
