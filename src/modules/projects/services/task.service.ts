import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import Objection from 'objection';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import { DocumentAttachmentsRepository, DocumentsRepository, MetadataRepository, ProjectRepository, ProjectTaskRepository, UserRepository } from '@/repositories';

import { AttachmentsModelType, DocumentsModelType, ProjectTaskModelType, UserModelType } from '@/models';
import { DocumentsDirectory, MetadataType, ProjectTaskStatus } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { CreateTask } from '@/shared/types/projects.type';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';

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
    private readonly attachmentRepository: DocumentAttachmentsRepository,
  ) {}

  async createTask(user: UserModelType, project_id: string, payload: CreateTask): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const project = await this.projectRepository.findOne({ id: project_id, company_id });
      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.assignee_id) {
        const assignee = await this.userRepository.findOne({ id: payload.assignee_id });
        if (!assignee) {
          return {
            status: false,
            message: 'Assignee not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      const existingTask = await this.projectTaskRepository.findOne({ project_id, name: payload.name });

      if (existingTask) {
        return {
          status: false,
          message: 'Task name already exists in this project',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      await Objection.Model.transaction(async (trx) => {
        const document_id = uuidv4();
        const task_id = uuidv4();
        const task_type_id = uuidv4();

        const metadataQuery = {
          company_id,
          type: MetadataType.TASK,
        };

        const eventType = await this.metadataRepository.findOne(metadataQuery);

        if (!eventType) await this.metadataRepository.create({ ...metadataQuery, id: task_type_id, name: 'Task' });

        const projectTaskData: Partial<ProjectTaskModelType> = {
          id: task_id,
          project_id,
          company_id,
          name: payload.name,
          description: payload.description,
          status: (payload?.status as ProjectTaskStatus) || ProjectTaskStatus.PENDING,
          assignee_id: payload.assignee_id,
          start_date: payload.start_date,
          end_date: payload.end_date,
        };

        const documentData: Partial<DocumentsModelType> = {
          id: document_id,
          company_id,
          project_id,
          task_id,
          type: MetadataType.TASK,
          document_type_id: task_type_id,
          name: payload.name,
        };

        const documentAttachmentData: Partial<AttachmentsModelType> = {
          document_id,
        };

        await this.projectTaskRepository.create(projectTaskData, trx);
        await this.documentRepository.create(documentData, trx);

        if (payload.attachments && payload.attachments.length) {
          await payload.attachments.forEach(async (fileData) => {
            if (!fileData.includes('http')) {
              const fileName = `${project_id}/${payload.name.replace(' ', '_').toLowerCase()}`;
              const { data } = await this.cloudinary.upload(DocumentsDirectory.TASKS, fileData, fileName);
              if (data) await this.attachmentRepository.create({ ...documentAttachmentData, media_url: data }, trx);
            }
          });
        }
      });

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

      const task = await this.projectTaskRepository.findOne({ id: task_id, company_id });
      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      if (payload.assignee_id) {
        const assignee = await this.userRepository.findOne({ id: payload.assignee_id });
        if (!assignee) {
          return {
            status: false,
            message: 'Assignee not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
        updateData.assignee_id = payload.assignee_id;
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
                if (data) await this.attachmentRepository.create({ ...documentAttachmentData, media_url: data }, trx);
              }
            });
          }
        }
      });

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

      return {
        status: true,
        message: 'Task retrieved successfully',
        data: task,
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

  async getAllTask(company_id: string, project_id: string): Promise<ServiceType> {
    try {
      const tasks = await this.projectTaskRepository.getAllTasks(company_id, project_id);

      const remappedTasks = tasks.map((task) => {
        return { ...task, start_date: dayjs(task.start_date).format('DD MMM, YYYY'), end_date: dayjs(task.end_date).format('DD MMM, YYYY') };
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
      await this.projectTaskRepository.delete({ project_id, id: task_id }, true);

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

      const task = await this.projectTaskRepository.findOne({ id: task_id, company_id });
      if (!task) {
        return {
          status: false,
          message: 'Task not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const document = await this.documentRepository.findOne({ task_id });
      if (!document) {
        return {
          status: false,
          message: 'Document not found for this task',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const attachment = await this.attachmentRepository.findOne({ id: attachment_id, document_id: document.id });
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
}
