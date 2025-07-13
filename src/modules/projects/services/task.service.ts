import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import Objection from 'objection';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import {
  DocumentAttachmentsRepository,
  DocumentsRepository,
  MetadataRepository,
  ProjectRepository,
  ProjectTaskAssigneesRepository,
  ProjectTaskRepository,
  ProjectTypeRepository,
  UserRepository,
} from '@/repositories';

import { AttachmentsModelType, DocumentsModelType, ProjectTaskAssigneesModelType, ProjectTaskModelType, UserModelType } from '@/models';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory, EmailSubject, MetadataType, ProjectTaskStatus } from '@/shared/enums';
import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { CreateTask } from '@/shared/types/projects.type';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { newTaskAssignedEmail, taskCompletedEmail } from '@/shared/utils/email';
import sendEmail from '@/shared/utils/nodemailer';

@injectable()
export class TaskService {
  private traceId = '[Task Service]';

  constructor(
    private readonly cloudinary: Cloudinary,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly documentRepository: DocumentsRepository,
    private readonly projectTaskRepository: ProjectTaskRepository,
    private readonly projectTaskAssigneesRepository: ProjectTaskAssigneesRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
    private readonly attachmentRepository: DocumentAttachmentsRepository,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async createTask(user: UserModelType, project_id: string, payload: CreateTask): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const start = dayjs(payload.start_date);
      const end = dayjs(payload.end_date);

      if (end.isBefore(start)) {
        return {
          status: false,
          message: 'End date cannot be before start date',
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

      const assigneePayload: Array<Partial<ProjectTaskAssigneesModelType>> = [];

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
        const projectTaskData: Partial<ProjectTaskModelType> = {
          id: task_id,
          project_id,
          company_id,
          name: payload.name,
          description: payload.description,
          status: (payload?.status as ProjectTaskStatus) || ProjectTaskStatus.PENDING,
          start_date: dayjs(payload.start_date).format(),
          end_date: dayjs(payload.end_date).format(),
          is_visible_to_client: payload.is_visible_to_client,
          author_id: user.id,
          task_type_id: payload?.task_type_id ?? null,
          project_type_id: payload.project_type_id,
        };

        const documentData: Partial<DocumentsModelType> = {
          id: document_id,
          company_id,
          project_id,
          task_id,
          type: MetadataType.TASK,
          name: payload.name,
          is_visible_to_client: payload.is_visible_to_client,
        };

        const documentAttachmentData: Partial<AttachmentsModelType> = {
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
        const email = newTaskAssignedEmail(taskAuthor.name, payload.name, project.name, payload.end_date, '');
        await sendEmail(taskAuthor.email, emailSubject, email);
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

      const updateData: Partial<ProjectTaskModelType> = { description: payload?.description };

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

      if (payload.start_date) updateData.start_date = dayjs(payload.start_date).format();
      if (payload.end_date) updateData.end_date = dayjs(payload.end_date).format();
      if (payload.status) updateData.status = payload.status as ProjectTaskStatus;
      if (payload.is_visible_to_client !== null || payload.is_visible_to_client !== undefined) updateData.is_visible_to_client = payload.is_visible_to_client;

      await Objection.Model.transaction(async (trx) => {
        await this.projectTaskRepository.update({ id: task_id, company_id }, updateData, trx);

        if (payload.attachments && payload.attachments.length) {
          const document = await this.documentRepository.findOne({ task_id }, trx);
          if (document) {
            const documentAttachmentData: Partial<AttachmentsModelType> = {
              document_id: document.id,
            };

            await payload.attachments.forEach(async (fileData) => {
              if (!fileData.includes('http')) {
                const fileName = `${project_id}/${payload.name.replace(' ', '_').toLowerCase()}`;
                const { data } = await this.cloudinary.upload(DocumentsDirectory.TASKS, fileData, fileName);
                console.log('CLOUDINARY DATA', data);
                if (data) await this.attachmentRepository.create({ ...documentAttachmentData, media_url: data }, trx);
              }
            });
          }
        }
      });

      if (payload.status && payload.status === ProjectTaskStatus.COMPLETED) {
        const emailSubject = `${EmailSubject.TASK_COMPLETED} - ${task.name}`;
        const taskAuthor = await this.userRepository.findOne({ id: task.author_id });
        const email = taskCompletedEmail(taskAuthor.name, task.name, '');
        await sendEmail(taskAuthor.email, emailSubject, email);
      }

      if (payload.assignees && payload.assignees.length) {
        for (const assignee_id of payload.assignees ?? []) {
          const emailSubject = `${EmailSubject.TASK_ASSIGNED} - ${payload.name}`;
          const taskAuthor = await this.userRepository.findOne({ id: assignee_id });
          const email = newTaskAssignedEmail(taskAuthor.name, payload.name, project.name, payload.end_date, '');
          await sendEmail(taskAuthor.email, emailSubject, email);
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

  async getTaskById(company_id: string, project_id: string, task_id: string): Promise<ServiceType> {
    try {
      const task = await this.projectTaskRepository.getTaskDetails(company_id, project_id, task_id);

      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      task.start_date = dayjs(task.start_date).format('DD MMM, YYYY');

      task.end_date = dayjs(task.end_date).format('DD MMM, YYYY');
      task['assignees'] = task.assignees.map((assignee) => assignee.user).flat() as any;

      const today = dayjs().startOf('day');
      const endDate = dayjs(task.end_date).startOf('day');

      const isOverdue = task.status !== ProjectTaskStatus.COMPLETED && endDate.isBefore(today);

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

  async getAllTask(company_id: string, project_id: string | null, query: ObjectLiteral = {}): Promise<ServiceType> {
    try {
      const tasks = await this.projectTaskRepository.getAllTasks(company_id, project_id, query);

      const remappedTasks = tasks.map((task) => {
        const today = dayjs().startOf('day');
        const endDate = dayjs(task.end_date).startOf('day');

        const isOverdue = task.status !== ProjectTaskStatus.COMPLETED && endDate.isBefore(today);
        return {
          ...task,
          start_date: dayjs(task.start_date).format('DD MMM, YYYY'),
          end_date: dayjs(task.end_date).format('DD MMM, YYYY'),
          assignees: task.assignees.map((assignee) => assignee.user).flat(),
          is_over_due: isOverdue,
        };
      });

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

  async deleteTask(project_id: string, task_id: string): Promise<ServiceType> {
    try {
      await Objection.Model.transaction(async (trx) => {
        await this.projectTaskRepository.delete({ project_id, id: task_id }, false, trx);
        const document = await this.documentRepository.findOne({ task_id, deleted_at: null });
        console.log('DELETE TASK', JSON.stringify({ document }));
        if (document) {
          await this.attachmentRepository.delete({ document_id: document.id, deleted_at: null }, false, trx);
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

  private async updateTaskAssignees(payload: { task_id: string; project_id: string; company_id: string; current_assignees: ProjectTaskAssigneesModelType[]; new_assignees: string[] }): Promise<void> {
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
}
