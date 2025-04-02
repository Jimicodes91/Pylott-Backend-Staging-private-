import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { v4 as uuidv4 } from 'uuid';
import Objection from 'objection';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import {
  ProjectRepository,
  MilestonesRepository,
  ClientRepository,
  ProjectTypeRepository,
  ProjectSettingsRepository,
  MetadataRepository,
  DocumentsRepository,
  DocumentAttachmentsRepository,
} from '@/repositories';

import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { UserModelType } from '@/models';
import { CreateProjectType, ProcessCustomFieldsResult } from '@/shared/types/projects.type';
import { ProjectStatus, FieldTypeEnum, MetadataType, DocumentsDirectory } from '@/shared/enums';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';

@injectable()
export class ProjectService {
  private traceId = '[PROJECT SERVICE]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly milestonesRepository: MilestonesRepository,
    private readonly clientRepository: ClientRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly attachmentsRepository: DocumentAttachmentsRepository,
    private readonly cloudinary: Cloudinary,
  ) {}
  async getAllProjects(
    company_id: string,
    filters: {
      status?: string;
      client_id?: string;
      consultant_id?: string;
      project_type_id?: string;
    } = {},
  ): Promise<ServiceType> {
    try {
      const query: ObjectLiteral = { company_id };

      if (filters.status) query.status = filters.status;
      if (filters.client_id) query.client_id = filters.client_id;
      if (filters.consultant_id) query.consultant_id = filters.consultant_id;
      if (filters.project_type_id) query.project_type_id = filters.project_type_id;

      const projects = await this.projectRepository.getProjectsAndAssociatedEntities(query);

      const formattedProjects = projects.map((project) => {
        const directDocuments =
          project.documents?.map((doc) => ({
            id: doc.id,
            name: doc.name,
            attachments: doc.attachments,
            type: doc.document_type_id === 'custom_field' ? 'custom' : doc.document_type_id,
          })) || [];

        return {
          ...project,
          timeline: this.calculateTimeline(project.start_date, project.end_date),
          documents: directDocuments,
        };
      });

      return {
        status: true,
        message: 'Projects fetched successfully',
        data: formattedProjects,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching projects ===> ${JSON.stringify({
          company_id,
          filters,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getProject(company_id: string, project_id: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.getProjectDetails(company_id, project_id);

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const projectWithTimeline = this.formatProjectWithTimeline(project);

      return {
        status: true,
        message: 'Project fetched successfully',
        data: projectWithTimeline,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching project ===> ${JSON.stringify({
          company_id,
          project_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async createProject(user: UserModelType, payload: CreateProjectType): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      if (payload.client_id) {
        const client = await this.clientRepository.findOne({
          id: payload.client_id,
          company_id,
        });

        if (!client) {
          return {
            status: false,
            message: 'Client not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      const projectType = await this.projectTypeRepository.findOne({
        id: payload.project_type_id,
        company_id,
      });

      if (!projectType) {
        return {
          status: false,
          message: 'Project type not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.milestone_id) {
        const milestone = await this.milestonesRepository.findOne({
          id: payload.milestone_id,
          company_id,
        });

        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        if (milestone.project_type_id !== payload.project_type_id) {
          return {
            status: false,
            message: 'Milestone is not compatible with selected project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      const processedCustomFields = await this.processCustomFields(payload.custom_fields || {}, projectType.custom_fields || [], user.company_id, payload.project_type_id);

      if (!processedCustomFields.valid) {
        return {
          status: false,
          message: processedCustomFields.message,
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      let project;
      await Objection.Model.transaction(async (trx) => {
        project = await this.projectRepository.create(
          {
            company_id,
            name: payload.name.trim(),
            client_id: payload.client_id || null,
            consultant_id: payload.consultant_id || null,
            project_type_id: payload.project_type_id,
            start_date: payload.start_date,
            end_date: payload.end_date,
            milestone_id: payload.milestone_id || null,
            status: payload.status || ProjectStatus.NOT_STARTED,
            created_by: user.id,
            custom_fields: processedCustomFields.fields,
          },
          trx,
        );

        await this.projectSettingsRepository.create(
          {
            company_id,
            project_id: project.id,
          },
          trx,
        );

        if (processedCustomFields.documentData.length > 0) {
          for (const docData of processedCustomFields.documentData) {
            const document = await this.documentsRepository.create(
              {
                id: uuidv4(),
                company_id,
                project_id: project.id,
                name: docData.name,
                type: MetadataType.PROJECT,
                is_visible_to_client: true,
                document_type_id: 'custom_field',
              },
              trx,
            );

            for (const fileUrl of docData.files) {
              await this.attachmentsRepository.create(
                {
                  document_id: document.id,
                  media_url: fileUrl,
                },
                trx,
              );
            }
          }
        }
      });

      return {
        status: true,
        message: 'Project created successfully',
        statusCode: StatusCodes.CREATED,
        data: this.formatProjectWithTimeline(project),
      };
    } catch (error) {
      console.error(`${this.traceId} Error creating project:`, error);
      return {
        status: false,
        message: 'An error occurred while creating project',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }
  }

  async updateProject(user: UserModelType, project_id: string, payload: Partial<CreateProjectType>): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      const project = await this.projectRepository.findOne({
        id: project_id,
        company_id,
      });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      let projectType = null;
      if (payload.project_type_id) {
        projectType = await this.projectTypeRepository.findOne({
          id: payload.project_type_id,
          company_id,
        });

        if (!projectType) {
          return {
            status: false,
            message: 'Project type not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        if (payload.project_type_id !== project.project_type_id) {
          if (project.milestone_id) {
            const milestone = await this.milestonesRepository.findOne({
              id: project.milestone_id,
            });

            if (milestone && milestone.project_type_id !== payload.project_type_id) {
              payload.milestone_id = null;
            }
          }
        }
      } else {
        projectType = await this.projectTypeRepository.findOne({
          id: project.project_type_id,
          company_id,
        });
      }

      let processedCustomFields: ProcessCustomFieldsResult = {
        valid: true,
        fields: {},
        documentData: [],
      };

      if (payload.custom_fields && projectType?.custom_fields) {
        const customFieldsResult = await this.processCustomFields({ ...(project.custom_fields || {}), ...payload.custom_fields }, projectType.custom_fields, company_id, project.project_type_id);

        if (!customFieldsResult.valid) {
          return {
            status: false,
            message: customFieldsResult.message || 'Invalid custom fields data',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }

        processedCustomFields = customFieldsResult as ProcessCustomFieldsResult;
      }

      if (payload.milestone_id) {
        const milestone = await this.milestonesRepository.findOne({
          id: payload.milestone_id,
          company_id,
        });

        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        const projectTypeId = payload.project_type_id || project.project_type_id;
        if (milestone.project_type_id !== projectTypeId) {
          return {
            status: false,
            message: 'Milestone is not compatible with this project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      let completedAt = project.completed_at;
      if (payload.status) {
        const validStatuses = Object.values(ProjectStatus);
        if (!validStatuses.includes(payload.status as ProjectStatus)) {
          return {
            status: false,
            message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }

        if (payload.status === ProjectStatus.COMPLETED && project.status !== ProjectStatus.COMPLETED) {
          completedAt = new Date().toISOString();
        } else if (payload.status !== ProjectStatus.COMPLETED && project.status === ProjectStatus.COMPLETED) {
          completedAt = null;
        }
      }

      await Objection.Model.transaction(async (trx) => {
        const updateData = {
          ...payload,
          custom_fields: Object.keys(processedCustomFields.fields).length ? processedCustomFields.fields : null,
          completed_at: completedAt || project.completed_at,
        };

        await this.projectRepository.update({ id: project_id, company_id }, updateData, trx);

        if (processedCustomFields.documentData.length > 0) {
          for (const docData of processedCustomFields.documentData) {
            let document = await this.documentsRepository.findOne({ company_id, project_id });

            if (!document) {
              document = await this.documentsRepository.create(
                {
                  id: uuidv4(),
                  company_id,
                  project_id: project.id,
                  name: docData.name,
                  type: MetadataType.PROJECT,
                  is_visible_to_client: true,
                  document_type_id: 'custom_field',
                },
                trx,
              );
            }

            for (const fileUrl of docData.files) {
              await this.attachmentsRepository.create(
                {
                  document_id: document.id,
                  media_url: fileUrl,
                },
                trx,
              );
            }
          }
        }
      });

      return {
        status: true,
        message: 'Project updated successfully',
      };
    } catch (error) {
      console.error(`${this.traceId} Error updating project:`, error);
      return {
        status: false,
        message: 'An error occurred while updating project',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }
  }

  private async processCustomFields(
    providedFields: Record<string, any>,
    typeFields: Array<{
      name: string;
      field_key: string;
      field_type: FieldTypeEnum;
      options?: any;
      is_required?: boolean;
    }>,
    companyId: string,
    projectTypeId: string,
  ): Promise<{ valid: boolean; message?: string; fields: Record<string, any>; documentData?: Array<{ name: string; files: string[] }> }> {
    const resultFields: Record<string, any> = {};
    const documentData: Array<{ name: string; files: string[] }> = [];

    for (const field of typeFields) {
      const value = providedFields[field.field_key];

      if (field.is_required && (value === undefined || value === null || value === '')) {
        return {
          valid: false,
          message: `Missing required field: ${field.name}`,
          fields: {},
        };
      }

      if (value === undefined || value === null) continue;

      if (field.field_type === FieldTypeEnum.FILE) {
        const uploadResults = await this.processFileField(value, companyId, projectTypeId, field.field_key);

        if (!uploadResults.valid) {
          return {
            valid: false,
            message: uploadResults.message,
            fields: {},
          };
        }

        resultFields[field.field_key] = uploadResults.fileUrls;
        if (uploadResults.fileUrls.length > 0) {
          documentData.push({
            name: `${field.name} for ${projectTypeId}`,
            files: uploadResults.fileUrls,
          });
        }
      } else {
        const validation = this.validateFieldValue(value, field);
        if (!validation.valid) {
          return {
            valid: false,
            message: validation.message,
            fields: {},
          };
        }
        resultFields[field.field_key] = value;
      }
    }

    return {
      valid: true,
      fields: resultFields,
      documentData,
    };
  }

  private async processFileField(files: string[] | string, companyId: string, projectTypeId: string, fieldKey: string): Promise<{ valid: boolean; message?: string; fileUrls: string[] }> {
    const fileUrls: string[] = [];
    const filesArray = Array.isArray(files) ? files : [files];

    for (const file of filesArray) {
      if (typeof file === 'string' && file.startsWith('http')) {
        fileUrls.push(file);
        continue;
      }

      if (this.isBase64(file)) {
        try {
          const uploadResult = await this.handleBase64Upload(file, `${companyId}/${projectTypeId}/${fieldKey}`);
          if (uploadResult.url) {
            fileUrls.push(uploadResult.url);
          }
        } catch (error) {
          return {
            valid: false,
            message: `Error uploading file for ${fieldKey}: ${error.message}`,
            fileUrls: [],
          };
        }
      } else {
        return {
          valid: false,
          message: `Invalid file format for ${fieldKey}`,
          fileUrls: [],
        };
      }
    }

    return {
      valid: true,
      fileUrls,
    };
  }

  private async handleFileUploads(files: string[] | string, companyId: string, projectTypeId: string, fieldKey: string): Promise<{ valid: boolean; message?: string; fileUrls: string[] }> {
    const fileUrls: string[] = [];
    const filesArray = Array.isArray(files) ? files : [files];

    for (const file of filesArray) {
      if (typeof file === 'string' && file.startsWith('http')) {
        fileUrls.push(file);
        continue;
      }

      try {
        const fileName = `${companyId}/${projectTypeId}/${fieldKey}/${uuidv4()}`;
        const { data } = await this.cloudinary.upload(DocumentsDirectory.PROJECTS, file, fileName);

        if (data) fileUrls.push(data);
      } catch (error) {
        return {
          valid: false,
          message: `Error uploading file for ${fieldKey}: ${error.message}`,
          fileUrls: [],
        };
      }
    }

    return {
      valid: true,
      fileUrls,
    };
  }

  private validateFieldValue(
    value: any,
    field: {
      field_key: string;
      field_type: FieldTypeEnum;
      options?: any;
    },
  ): { valid: boolean; message?: string } {
    switch (field.field_type) {
      case FieldTypeEnum.NUMBER:
        if (isNaN(Number(value))) {
          return {
            valid: false,
            message: `Field ${field.field_key} must be a number`,
          };
        }
        break;

      case FieldTypeEnum.DATE:
        if (isNaN(Date.parse(value))) {
          return {
            valid: false,
            message: `Field ${field.field_key} must be a valid date`,
          };
        }
        break;

      case FieldTypeEnum.SELECT:
        if (!field.options || !Array.isArray(field.options)) {
          return {
            valid: false,
            message: `Field ${field.field_key} has invalid options configuration`,
          };
        }
        if (!field.options.includes(value)) {
          return {
            valid: false,
            message: `Field ${field.field_key} must be one of: ${field.options.join(', ')}`,
          };
        }
        break;

      case FieldTypeEnum.TEXT:
      case FieldTypeEnum.TEXTAREA:
        if (typeof value !== 'string') {
          return {
            valid: false,
            message: `Field ${field.field_key} must be text`,
          };
        }
        break;
    }

    return { valid: true };
  }

  private formatProjectWithTimeline(project: any): any {
    if (!project) return null;

    return {
      ...project,
      timeline: this.calculateTimeline(project.start_date, project.end_date),
    };
  }

  private formatProjectsWithTimeline(projects: any[]): any[] {
    if (!projects || !Array.isArray(projects)) return [];

    return projects.map((project) => this.formatProjectWithTimeline(project));
  }

  private calculateTimeline(startDate: string, endDate: string): string {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      return 'Invalid date range';
    }

    const diff = end.diff(start);
    const duration = dayjs.duration(diff);

    const years = duration.years();
    const months = duration.months();
    const days = duration.days();

    if (years > 0) {
      if (months > 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    if (months > 0) {
      if (days > 0) {
        return `${months} ${months === 1 ? 'month' : 'months'}, ${days} ${days === 1 ? 'day' : 'days'}`;
      }
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    return '1 day';
  }

  private isBase64(value: any): boolean {
    if (typeof value !== 'string') return false;
    const base64Regex = /^data:([a-zA-Z]+\/[a-zA-Z0-9-+.]+);base64,[a-zA-Z0-9+/]+={0,2}$/;
    return base64Regex.test(value);
  }

  private async handleBase64Upload(base64Data: string, filePathPrefix: string): Promise<{ url: string; type: string }> {
    const mimeTypeMatch = base64Data.match(/^data:(.+?);base64,/);

    const mimeType = mimeTypeMatch[1];
    const extension = mimeType.split('/')[1] || 'bin';
    const fileName = `${uuidv4()}.${extension}`;

    const uploadResponse = await this.cloudinary.upload(filePathPrefix as any, base64Data, fileName);

    return {
      url: uploadResponse?.data,
      type: mimeType,
    };
  }
}
