import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Objection from 'objection';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import {
  ProjectRepository,
  MilestonesRepository,
  ClientRepository,
  ProjectTypeRepository,
  ProjectSettingsRepository,
  DocumentsRepository,
  DocumentAttachmentsRepository,
  ProjectFormsRepository,
  ProjectFormFieldRepository,
} from '@/repositories';

import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { MilestonesModelType, ProjectFormFieldModelType, ProjectModelType, UserModelType } from '@/models';
import { CreateProjectType } from '@/shared/types/projects.type';
import { DocumentsDirectory, MetadataType, ProjectStatus } from '@/shared/enums';
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
    private readonly documentsRepository: DocumentsRepository,
    private readonly attachmentsRepository: DocumentAttachmentsRepository,
    private readonly projectFormRepository: ProjectFormsRepository,
    private readonly projectFormFieldRepository: ProjectFormFieldRepository,
    private readonly cloudinary: Cloudinary,
  ) {}

  async getAllProjects(
    company_id: string,
    filters: {
      status?: string;
      client_id?: string;
      consultant_id?: string;
      project_type_id?: string;
      milestone_id?: string;
    } = {},
  ): Promise<ServiceType> {
    try {
      const query: ObjectLiteral = { company_id, deleted_at: null };

      if (filters.status) query.status = filters.status;
      if (filters.client_id) query.client_id = filters.client_id;
      if (filters.consultant_id) query.consultant_id = filters.consultant_id;
      if (filters.project_type_id) query.project_type_id = filters.project_type_id;
      if (filters.milestone_id) query.milestone_id = filters.milestone_id;

      const projects = await this.projectRepository.getProjectsAndAssociatedEntities(query);

      const formattedProjects = projects.map((project) => ({
        ...project,
        timeline: this.calculateTimeline(project.milestone.duration),
        documents:
          project.documents?.map((doc) => ({
            id: doc.id,
            name: doc.name,
            attachments: doc.attachments,
            type: doc.document_type_id === 'custom_field' ? 'custom' : doc.document_type_id,
          })) || [],
      }));

      return {
        status: true,
        message: 'Projects fetched successfully',
        data: formattedProjects,
      };
    } catch (error) {
      console.error(`${this.traceId} Error fetching projects:`, error);
      return {
        status: false,
        message: 'Failed to fetch projects',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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

      const form = await this.projectFormRepository.getCompanyForm(company_id);
      const formFields = form ? await this.projectFormFieldRepository.findMany({ form_id: form.id }) : [];

      const formattedFormFields = await Promise.all(
        formFields.map(async (f) => {
          const payload = {
            id: f.id,
            name: f.name,
            type: f.type,
            is_required: f.is_required,
            value: project.form_data?.[f.slug] || null,
            slug: f.slug,
          };

          if (f.slug === 'project_client' && project.form_data?.[f.slug] && project.form_data?.[f.slug].length) {
            const clients = await this.clientRepository.getClientsWhereIn(project.form_data?.[f.slug]);

            const mappedClients = clients?.map((client) => {
              const { user, ...others } = client;
              return { ...others, name: user?.name };
            });

            payload.value = mappedClients;
          }

          return payload;
        }),
      );

      return {
        status: true,
        message: 'Project fetched successfully',
        data: {
          ...this.formatProjectWithTimeline(project),
          form_fields: formattedFormFields,
        },
      };
    } catch (error) {
      console.error(`${this.traceId} Error fetching project:`, error);
      return {
        status: false,
        message: 'Failed to fetch project',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async createProject(user: UserModelType, payload: CreateProjectType): Promise<ServiceType> {
    try {
      const company_id = user.company_id;
      let milestone: MilestonesModelType;

      if (payload['pipeline']) {
        const projectType = await this.projectTypeRepository.findOne({
          id: payload['pipeline'],
          company_id,
          deleted_at: null,
        });

        if (!projectType) {
          return {
            status: false,
            message: 'Invalid project type (pipeline)',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      if (payload.client_id) {
        const client = await this.clientRepository.findOne({
          id: payload.client_id,
          company_id,
          deleted_at: null,
        });
        if (!client) {
          return {
            status: false,
            message: 'Client not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      if (payload.milestone_id) {
        milestone = await this.milestonesRepository.findOne({
          id: payload.milestone_id,
          company_id,
          deleted_at: null,
        });
        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
        if (milestone.project_type_id !== payload['pipeline']) {
          return {
            status: false,
            message: 'Milestone does not belong to selected project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      } else if (payload['pipeline'] && !payload.milestone_id) {
        milestone = await this.milestonesRepository.getFirstCreatedMilestone(company_id, payload['pipeline']);
        payload.milestone_id = milestone?.id ?? null;
      }

      if (payload['project_client']) {
        for (const client of payload['project_client']) {
          const clientRecord = await this.clientRepository.findOne({
            id: client,
            company_id,
            deleted_at: null,
          });
          if (!clientRecord) {
            return {
              status: false,
              message: 'Client not found',
              statusCode: StatusCodes.NOT_FOUND,
            };
          }
        }
      }

      const form = await this.projectFormRepository.getCompanyForm(company_id);
      if (!form) {
        return {
          status: false,
          message: 'Project form not configured',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const formFields = await this.projectFormFieldRepository.findMany({ form_id: form.id });
      const errors = this.validateFormFields(payload, formFields);
      if (errors.length > 0) {
        return {
          status: false,
          message: 'Validation failed',
          data: { errors },
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const documentFields = formFields.filter((f) => f.type === 'document');
      const documentUploads = await this.processDocumentUploads(payload, documentFields, company_id);
      if (!documentUploads.success) {
        return documentUploads.errorResponse;
      }

      let project;
      await Objection.Model.transaction(async (trx) => {
        project = await this.projectRepository.create(
          {
            company_id,
            name: payload['project_name'] || null,
            client_id: payload.client_id || null,
            consultant_id: payload.consultant_id || null,
            project_type_id: payload['pipeline'] || null,
            milestone_id: payload.milestone_id || null,
            start_date: payload['start_date'],
            end_date: payload['end_date']?.length ? payload['end_date'] : null,
            status: ProjectStatus.IN_PROGRESS,
            form_data: payload,
            jurisdiction: payload?.jurisdiction,
            visa_required: payload?.visa_required,
            package: payload?.package,
          },
          trx,
        );

        for (const doc of documentUploads.data) {
          const document = await this.documentsRepository.create(
            {
              company_id,
              project_id: project.id,
              name: `Project ${doc.fieldName}`,
              type: MetadataType.FORM_FIELD,
              document_type_id: doc.fieldId,
            },
            trx,
          );

          for (const url of doc.urls) {
            await this.attachmentsRepository.create(
              {
                document_id: document.id,
                media_url: url,
                field_id: doc.fieldId,
              },
              trx,
            );
          }
        }

        await this.projectSettingsRepository.create(
          {
            company_id,
            project_id: project.id,
          },
          trx,
        );

        if (payload.milestones && payload.milestones.length) {
          for (const milestoneRecord of payload.milestones) {
            const existingMilestone = await this.milestonesRepository.findOne({
              company_id,
              project_type_id: milestoneRecord.project_type_id,
              name: milestoneRecord.name,
              deleted_at: null,
            });

            if (!existingMilestone) {
              await this.milestonesRepository.create(
                {
                  ...milestoneRecord,
                  company_id,
                  is_system: false,
                  completed_at: null,
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
        data: this.formatProjectWithTimeline(project, milestone?.duration),
        statusCode: StatusCodes.CREATED,
      };
    } catch (error) {
      console.error(`${this.traceId} Error creating project:`, error);
      return {
        status: false,
        message: 'Failed to create project',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
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

        if (project.milestone_id) {
          const milestone = await this.milestonesRepository.findOne({
            id: project.milestone_id,
            company_id,
          });
          if (milestone && milestone.project_type_id !== payload.project_type_id) {
            payload.milestone_id = null;
          }
        }
      }

      if (payload.client_id && payload.client_id !== project.client_id) {
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

      if (payload.milestone_id && payload.milestone_id !== project.milestone_id) {
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
        if (projectTypeId && milestone.project_type_id !== projectTypeId) {
          return {
            status: false,
            message: 'Milestone does not belong to this project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      if (payload['project_client']) {
        const updateClientsPayload = Array.from(new Set(payload['project_client']));
        for (const client of updateClientsPayload as Array<string>) {
          const clientRecord = await this.clientRepository.findOne({
            id: client,
            company_id,
            deleted_at: null,
          });
          if (!clientRecord) {
            return {
              status: false,
              message: 'Client not found',
              statusCode: StatusCodes.NOT_FOUND,
            };
          }
        }
        payload['project_client'] = updateClientsPayload;
      }

      const form = await this.projectFormRepository.getCompanyForm(company_id);
      if (!form) {
        return {
          status: false,
          message: 'Project form not configured',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const formFields = await this.projectFormFieldRepository.findMany({ form_id: form.id });
      const updatedFormData = { ...project.form_data, ...payload };
      const errors = this.validateFormFields(updatedFormData, formFields);
      if (errors.length > 0) {
        return {
          status: false,
          message: 'Validation failed',
          data: { errors },
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const documentFields = formFields.filter((f) => f.type === 'document');
      const documentUploads = await this.processDocumentUploads(payload, documentFields, company_id);
      if (!documentUploads.success) {
        return documentUploads.errorResponse;
      }

      let completedAt = project.completed_at;
      if (payload.status) {
        if (payload.status === ProjectStatus.COMPLETED && project.status !== ProjectStatus.COMPLETED) {
          completedAt = new Date().toISOString();
        } else if (payload.status !== ProjectStatus.COMPLETED && project.status === ProjectStatus.COMPLETED) {
          completedAt = null;
        }
      }

      await Objection.Model.transaction(async (trx) => {
        const updateData = {
          ...payload,
          form_data: JSON.stringify(updatedFormData),
          completed_at: completedAt,
        };

        await this.projectRepository.update({ id: project_id, company_id }, updateData, trx);

        for (const doc of documentUploads.data) {
          let document = await this.documentsRepository.findOne({
            company_id,
            project_id,
            document_type_id: doc.fieldId,
          });

          if (!document) {
            document = await this.documentsRepository.create(
              {
                company_id,
                project_id,
                name: `Project ${doc.fieldName}`,
                type: MetadataType.FORM_FIELD,
                document_type_id: doc.fieldId,
              },
              trx,
            );
          }

          for (const url of doc.urls) {
            await this.attachmentsRepository.create(
              {
                document_id: document.id,
                media_url: url,
                field_id: doc.fieldId,
              },
              trx,
            );
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
        message: 'Failed to update project',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  }

  private validateFormFields(payload: Record<string, any>, formFields: Array<ProjectFormFieldModelType>): string[] {
    const errors: string[] = [];

    formFields.forEach((field) => {
      const value = payload[field.slug];

      if (field.is_required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.slug} is required`);
        return;
      }

      if (value === undefined || value === null) return;

      switch (field.type) {
        case 'select':
          if (field.options && !field.options.includes(value)) {
            errors.push(`Invalid value for ${field.name}. Must be one of: ${field.options.join(', ')}`);
          }
          break;
        case 'date':
          if (isNaN(new Date(value).getTime()) && field.is_required) {
            errors.push(`Invalid date format for ${field.name}`);
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${field.slug} must be a number`);
          }
          break;
        case 'document':
          if (field.is_required && (!Array.isArray(value) || value.length === 0)) {
            errors.push(`At least one document is required for ${field.name}`);
          }
          break;
      }
    });

    return errors;
  }

  private async processDocumentUploads(
    payload: Record<string, any>,
    documentFields: Array<{
      id: string;
      name: string;
      is_multiple?: boolean;
      max_files?: number;
    }>,
    companyId: string,
  ): Promise<{
    success: boolean;
    errorResponse?: ServiceType;
    data: Array<{
      fieldId: string;
      fieldName: string;
      urls: string[];
    }>;
  }> {
    const results: Array<{
      fieldId: string;
      fieldName: string;
      urls: string[];
    }> = [];

    for (const field of documentFields) {
      const files = payload[field.name];
      if (!files) continue;

      const filesArray = Array.isArray(files) ? files : [files];

      if (field.max_files && filesArray.length > field.max_files) {
        return {
          success: false,
          errorResponse: {
            status: false,
            message: `Maximum ${field.max_files} files allowed for ${field.name}`,
            statusCode: StatusCodes.BAD_REQUEST,
          },
          data: [],
        };
      }

      const urls: string[] = [];
      for (const file of filesArray) {
        try {
          const uploadPath = `${companyId}/${field.id}`;
          if (file.includes('http')) {
            urls.push(file);
          } else {
            const result = await this.cloudinary.upload(DocumentsDirectory.FORM_FIELD, file, uploadPath);
            if (result.data) {
              urls.push(result.data);
            }
          }
        } catch (error) {
          return {
            success: false,
            errorResponse: {
              status: false,
              message: `Failed to upload document for ${field.name}: ${error.message}`,
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            },
            data: [],
          };
        }
      }

      results.push({
        fieldId: field.id,
        fieldName: field.name,
        urls,
      });
    }

    return {
      success: true,
      data: results,
    };
  }

  private formatProjectWithTimeline(project: ProjectModelType, override_value: number | null = null): any {
    if (!project && !override_value) return null;

    return {
      ...project,
      timeline: override_value ?? this.calculateTimeline(project.milestone.duration),
    };
  }

  private calculateTimeline(durationInDays: number): string {
    durationInDays = Number(durationInDays);

    if (durationInDays <= 0) {
      return '1 day';
    }

    const years = Math.floor(durationInDays / 365);
    const remainingDaysAfterYears = durationInDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

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

    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
}
