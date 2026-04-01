import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { RedisClientType } from 'redis';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import {
  ProjectRepository,
  MilestonesRepository,
  ProjectTypeRepository,
  ProjectSettingsRepository,
  DocumentsRepository,
  DocumentAttachmentsRepository,
  ProjectFormsRepository,
  ProjectFormFieldRepository,
  UserRepository,
  ProjectMembersRepository,
} from '@/repositories';

import { ServiceType } from '@/shared/types/general.type';
import { MilestonesModelType } from '@/models/milestones.model';
import { ProjectFormFieldModelType } from '@/models/project_form_fields.model';
import { ProjectMemebersModelType } from '@/models/project_members.model';
import { ProjectModelType } from '@/models/project.model';
import { UserModelType } from '@/models/user.model';
import { CreateProjectType } from '@/shared/types/projects.type';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory, MetadataType, ProjectMemberTypeEnum, ProjectStatus, RedisPrefixKeyEnum, UserRoles } from '@/shared/enums';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { ContactRespository } from '@/repositories/contact.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Redis } from '@/shared/utils/redis/redis';
import sendEmail from '@/shared/utils/nodemailer';
import { toTitleCase } from '@/shared/utils/any';
import { newProjectCreatedEmail } from '@/shared/utils/email';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

@injectable()
export class ProjectService {
  private traceId = '[PROJECT SERVICE]';
  private readonly redis: RedisClientType;

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly milestonesRepository: MilestonesRepository,
    private readonly contactRepository: ContactRespository,
    private readonly userRepository: UserRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly attachmentsRepository: DocumentAttachmentsRepository,
    private readonly projectFormRepository: ProjectFormsRepository,
    private readonly projectFormFieldRepository: ProjectFormFieldRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly authSvc: AuthService,
    private readonly cloudinary: Cloudinary,
    _redis: Redis,
  ) {
    this.redis = _redis.getInstance();
  }

  async getAllProjects(
    company_id: string,
    filters: {
      status?: string;
      client_id?: string;
      consultant_id?: string;
      project_type_id?: string;
      milestone_id?: string;
      search?: string;
    } = {},
  ): Promise<ServiceType> {
    try {
      if (filters.client_id) {
        const user = await this.userRepository.findOne({ id: filters.client_id, deleted_at: null });

        if (user) {
          filters['client_email'] = user.email;
        }
      }

      const projects = await this.projectRepository.getProjectsAndAssociatedEntities(
        {
          status: filters?.status,
          consultant_id: filters?.consultant_id,
          project_type_id: filters?.project_type_id,
          milestone_id: filters?.milestone_id,
          client_email: filters['client_email'],
          company_id,
        },
        filters.search,
      );

      if (!projects.length) {
        return {
          status: true,
          message: 'Projects fetched successfully',
          data: [],
        };
      }

      const form = await this.projectFormRepository.getCompanyForm(company_id);
      const formFields = form ? await this.projectFormFieldRepository.findMany({ form_id: form.id }) : [];

      const allClientContactIds = new Set<string>();
      projects.forEach((project) => {
        const clientIds = project.form_data?.project_client;
        if (clientIds && Array.isArray(clientIds)) {
          clientIds.forEach((id) => allClientContactIds.add(id));
        }
      });

      let clientsMap = new Map();
      if (allClientContactIds.size > 0) {
        const clients = await this.contactRepository.getClientsWhereIn([...allClientContactIds]);
        clientsMap = new Map(clients.map((c) => [c.id, c]));
      }

      const formattedProjects = projects.map((project) => {
        const formattedFormFields = formFields.map((f) => {
          const value = project.form_data?.[f.slug] || null;
          const payload = {
            id: f.id,
            name: f.name,
            type: f.type,
            is_required: f.is_required,
            value,
            slug: f.slug,
          };

          if (f.slug === 'project_client' && Array.isArray(value)) {
            payload.value = value.map((id) => clientsMap.get(id)).filter(Boolean);
          }

          return payload;
        });

        return {
          ...project,
          form_fields: formattedFormFields,
          timeline: this.calculateTimeline(project?.milestone?.duration ?? 0),
          project_timeline: this.calculateTimeline(project?.project_type?.milestones?.map((ms) => ms?.duration ?? 0).reduce((a, b) => a + b, 0) ?? 0),
          total_duration_days: project?.project_type?.milestones?.map((ms) => ms?.duration ?? 0).reduce((a, b) => a + b, 0) ?? 0,
          documents:
            project.documents?.map((doc) => ({
              id: doc.id,
              name: doc.name,
              attachments: doc.attachments,
              type: doc.document_type_id === 'custom_field' ? 'custom' : doc.document_type_id,
            })) || [],
        };
      });

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

  async searchProject(company_id: string, search: string): Promise<ServiceType> {
    try {
      const projects = await this.projectRepository.searchProjectsByName(company_id, search);

      return { status: true, message: 'Searched projects', data: projects };
    } catch (error) {
      console.error(`${this.traceId} Error searching project ===> ${search}`, error);
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

          if (f.slug === 'project_client' && project.form_data?.[f.slug] && Array.isArray(project.form_data?.[f.slug])) {
            const clients = await this.contactRepository.getClientsWhereIn(project.form_data?.[f.slug]);

            const mappedClients = clients;

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
      const projectId = uuidv4();
      let projectType;

      if (payload['journey']) {
        projectType = await this.projectTypeRepository.getProjectType(company_id, payload['journey']);

        if (!projectType) {
          return {
            status: false,
            message: 'Invalid project type (pipeline)',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      if (payload.client_id) {
        const client = await this.contactRepository.findOne({
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
        if (milestone.project_type_id !== payload['journey']) {
          return {
            status: false,
            message: 'Milestone does not belong to selected project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      } else if (payload['journey'] && !payload.milestone_id) {
        milestone = await this.milestonesRepository.getFirstCreatedMilestone(company_id, payload['journey']);
        payload.milestone_id = milestone?.id ?? null;
      }

      // Multi-client duplicate email validation
      if (payload.clients && Array.isArray(payload.clients) && payload.clients.length > 0) {
        const emails = payload.clients.map((c) => c.email.trim().toLowerCase());
        const seen = new Set<string>();
        for (const email of emails) {
          if (seen.has(email)) {
            return {
              status: false,
              message: `Duplicate client email: ${email}`,
              statusCode: StatusCodes.BAD_REQUEST,
            };
          }
          seen.add(email);
        }
      }

      const nonExistentClients = [];
      const existentClients: Array<Partial<ProjectMemebersModelType>> = [];
      const existentClientsEmail = [];

      // Multi-client contact creation loop (falls back to single client_email)
      if (payload.clients && Array.isArray(payload.clients) && payload.clients.length > 0) {
        if (!payload['project_client']) payload['project_client'] = [];
        for (const clientEntry of payload.clients) {
          const clientEmail = clientEntry.email.trim().toLowerCase();
          let contact = await this.contactRepository.findOne({ company_id, email: clientEmail, deleted_at: null });
          if (!contact) {
            contact = await this.contactRepository.create({
              company_id,
              email: clientEmail,
              name: clientEntry.name?.trim() || clientEmail,
              phone: clientEntry.phone?.trim() || '',
              organization: (payload['client_organization'] as string)?.trim() || '',
              status: 'Uninvited',
              address: '',
              active_projects: '',
              total_projects: '',
              no_of_projects: '',
              closed_projects: '',
              assigned_to: [],
              added_by_user_id: user.id,
            });
          }
          if (Array.isArray(payload['project_client']) && !payload['project_client'].includes(contact.id)) {
            payload['project_client'] = [...payload['project_client'], contact.id];
          }
        }
      } else if (payload['client_email'] && typeof payload['client_email'] === 'string' && payload['client_email'].trim()) {
        // Backward compatibility: single client_email flow
        const clientEmail = (payload['client_email'] as string).trim().toLowerCase();
        let contact = await this.contactRepository.findOne({ company_id, email: clientEmail, deleted_at: null });
        if (!contact) {
          contact = await this.contactRepository.create({
            company_id,
            email: clientEmail,
            name: (payload['client_name'] as string)?.trim() || clientEmail,
            phone: (payload['client_phone'] as string)?.trim() || '',
            organization: (payload['client_organization'] as string)?.trim() || '',
            status: 'Uninvited',
            address: '',
            active_projects: '',
            total_projects: '',
            no_of_projects: '',
            closed_projects: '',
            assigned_to: [],
            added_by_user_id: user.id,
          });
        }
        if (!payload['project_client']) payload['project_client'] = [];
        if (Array.isArray(payload['project_client']) && !payload['project_client'].includes(contact.id)) {
          payload['project_client'] = [...payload['project_client'], contact.id];
        }
      }

      if (payload['project_client']) {
        for (const client of payload['project_client']) {
          const clientRecord = await this.contactRepository.findOne({
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

          const clientUserType = await this.userRepository.findOne({ deleted_at: null, email: clientRecord.email });
          if (!clientUserType) nonExistentClients.push(clientRecord.email);
          else {
            existentClientsEmail.push({ email: clientUserType.email, name: clientUserType.name });
            existentClients.push({ added_by: user.id, company_id, member_type: ProjectMemberTypeEnum.CLIENT, project_id: projectId, user_id: clientUserType.id, is_visible_to_client: true });
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

      // Sanitize payload data types based on field definitions
      formFields.forEach((field) => {
        const value = payload[field.slug];
        if (value !== undefined && value !== null && value !== '') {
          // For multiple select fields, ensure it's an array
          if (field.type === 'select' && field.is_multiple && !Array.isArray(value)) {
            // If it's a string, try to convert it (though validation should catch this)
            payload[field.slug] = typeof value === 'string' ? [value] : [];
          }
          // For text fields, ensure it's a string (not an array)
          if (field.type === 'text' && Array.isArray(value)) {
            // If it's an array, take the first element (though validation should catch this)
            payload[field.slug] = value.length > 0 ? value[0] : '';
          }
        }
      });

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

      const projectSettings = await this.projectSettingsRepository.getOne({ company_id });

      await Objection.Model.transaction(async (trx) => {
        project = await this.projectRepository.create(
          {
            id: projectId,
            company_id,
            name: payload['project_name'] || null,
            client_id: payload.client_id || null,
            consultant_id: payload.consultant_id || null,
            project_type_id: payload['journey'] || null,
            milestone_id: payload.milestone_id || null,
            start_date: payload['start_date']?.length ? payload['start_date'] : null,
            end_date: payload['end_date']?.length ? payload['end_date'] : null,
            status: ProjectStatus.IN_PROGRESS,
            form_data: payload,
            jurisdiction: payload?.jurisdiction,
            visa_required: payload?.visa_required,
            package: payload?.package,
            milestone_start_date: payload.milestone_id && payload['start_date'] ? payload['start_date'] : null,
            milestone_status: payload.milestone_id ? ProjectStatus.ON_TRACK : null,
            country: payload?.country ?? null,
            currency: payload?.currency ?? null,
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

        if (!projectSettings) {
          await this.projectSettingsRepository.create({ company_id }, trx);
        }

        await this.projectMembersRepository.createMultiple(existentClients, trx);

        if (payload.milestones && payload.milestones.length) {
          for (let i = 0; i < payload.milestones.length; i++) {
            const milestoneRecord = payload.milestones[i];
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
                  order: i + 1,
                },
                trx,
              );
            }
          }
        }
      });

      // Only send invites to non-registered clients if send_client_invite is true
      if (payload['send_client_invite'] === true) {
        for (const clientEmail of nonExistentClients) {
          try {
            await this.authSvc.sendInvitation(user.id, clientEmail, UserRoles.CLIENT);
            const projectMember: Partial<ProjectMemebersModelType> = {
              added_by: user.id,
              company_id,
              is_visible_to_client: true,
              member_type: ProjectMemberTypeEnum.CLIENT,
              project_id: projectId,
            };
            await this.redis.set(`${RedisPrefixKeyEnum.PROJECT_CLIENT_INVITATION}:${clientEmail}`, JSON.stringify(projectMember));
          } catch (error: any) {
            // Fail safe — continue with remaining clients
            console.error(`${this.traceId} Error inviting project client to pylott:`, error);
          }
        }

        for (const _email of existentClientsEmail) {
          try {
            const emailTemplate = newProjectCreatedEmail(_email.name, payload['project_name'], '');
            await sendEmail(_email.email, `New Project Created - ${toTitleCase(payload['project_name'])}`, emailTemplate);
          } catch (error: any) {
            console.error(`${this.traceId} Error sending project notification to existing client:`, error);
          }
        }
      }

      const author = user?.name?.length ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id;

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.PROJECT_CREATED,
        {
          user_id: user.id,
          company_id,
          description: 'Project created',
          entity_description: `${author} created a new project (${payload['project_name']})`,
          entity_id: projectId,
        },
        projectId,
      );

      return {
        status: true,
        message: 'Project created successfully',
        data: this.formatProjectWithTimeline({ ...project, project_type: projectType }, milestone?.duration ?? 0),
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

  async updateProjectV0(user: UserModelType, project_id: string, payload: Partial<CreateProjectType>): Promise<ServiceType> {
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
        const client = await this.contactRepository.findOne({
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
        payload['milestone_start_date'] = dayjs().format('YYYY-MM-DD HH:mm:ss');
        payload['milestone_status'] = ProjectStatus.ON_TRACK;
      }

      if (payload['project_client']) {
        const updateClientsPayload = Array.from(new Set(payload['project_client']));
        for (const client of updateClientsPayload as Array<string>) {
          const clientRecord = await this.contactRepository.findOne({
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

      // Sanitize payload data types based on field definitions
      formFields.forEach((field) => {
        const value = updatedFormData[field.slug];
        if (value !== undefined && value !== null && value !== '') {
          // For multiple select fields, ensure it's an array
          if (field.type === 'select' && field.is_multiple && !Array.isArray(value)) {
            // If it's a string, try to convert it (though validation should catch this)
            updatedFormData[field.slug] = typeof value === 'string' ? [value] : [];
          }
          // For text fields, ensure it's a string (not an array)
          if (field.type === 'text' && Array.isArray(value)) {
            // If it's an array, take the first element (though validation should catch this)
            updatedFormData[field.slug] = value.length > 0 ? value[0] : '';
          }
        }
      });

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
          completedAt = dayjs().format();
          const lastMilestone = await this.milestonesRepository.getLastCreatedMilestone(company_id, project.project_type_id);
          if (lastMilestone) {
            payload['milestone_id'] = lastMilestone.id;
          }
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

      const author = user?.name?.length ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id;

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.PROJECT_UPDATED,
        {
          user_id: user.id,
          company_id,
          description: 'Project updated',
          entity_description: `${author} updated project (${project.name})`,
          entity_id: project_id,
        },
        project_id,
      );

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

  async updateProject(user: UserModelType, project_id: string, data: Partial<CreateProjectType>): Promise<ServiceType> {
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

      let milestone: MilestonesModelType | null = null;
      let projectType;

      // Validate project type (journey)
      if (data['journey']) {
        projectType = await this.projectTypeRepository.getProjectType(company_id, data['journey']);
        if (!projectType) {
          return {
            status: false,
            message: 'Invalid project type (pipeline)',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      // Validate client
      if (data.client_id && data.client_id !== project.client_id) {
        const client = await this.contactRepository.findOne({
          id: data.client_id,
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

      // Validate milestone
      if (data.milestone_id && data.milestone_id !== project.milestone_id) {
        milestone = await this.milestonesRepository.findOne({
          id: data.milestone_id,
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
        const projectTypeId = data['journey'] || project.project_type_id;
        if (projectTypeId && milestone.project_type_id !== projectTypeId) {
          return {
            status: false,
            message: 'Milestone does not belong to this project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
        data['milestone_start_date'] = dayjs().format('YYYY-MM-DD HH:mm:ss');
        data['milestone_status'] = ProjectStatus.ON_TRACK;
      } else if (data['journey'] && !data.milestone_id) {
        milestone = await this.milestonesRepository.getFirstCreatedMilestone(company_id, data['journey']);
        data.milestone_id = milestone?.id ?? null;
      }

      const form = await this.projectFormRepository.getCompanyForm(company_id);
      if (!form) {
        return {
          status: false,
          message: 'Project form not configured',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const formFields = await this.projectFormFieldRepository.findMany({
        form_id: form.id,
      });

      const updatedFormData = { ...project.form_data, ...data };

      // Sanitize payload data types based on field definitions
      formFields.forEach((field) => {
        const value = updatedFormData[field.slug];
        if (value !== undefined && value !== null && value !== '') {
          // For multiple select fields, ensure it's an array
          if (field.type === 'select' && field.is_multiple && !Array.isArray(value)) {
            // If it's a string, try to convert it (though validation should catch this)
            updatedFormData[field.slug] = typeof value === 'string' ? [value] : [];
          }
          // For text fields, ensure it's a string (not an array)
          if (field.type === 'text' && Array.isArray(value)) {
            // If it's an array, take the first element (though validation should catch this)
            updatedFormData[field.slug] = value.length > 0 ? value[0] : '';
          }
        }
      });

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
      const documentUploads = await this.processDocumentUploads(data, documentFields, company_id);
      if (!documentUploads.success) {
        return documentUploads.errorResponse;
      }

      let completedAt = project.completed_at;
      if (data.status) {
        if (data.status === ProjectStatus.COMPLETED && project.status !== ProjectStatus.COMPLETED) {
          completedAt = dayjs().format();
          const lastMilestone = await this.milestonesRepository.getLastCreatedMilestone(company_id, project.project_type_id);
          if (lastMilestone) {
            data.milestone_id = lastMilestone.id;
          }
        } else if (data.status !== ProjectStatus.COMPLETED && project.status === ProjectStatus.COMPLETED) {
          completedAt = null;
        }
      }

      const projectSettings = await this.projectSettingsRepository.getOne({
        company_id,
      });

      await Objection.Model.transaction(async (trx) => {
        const updateData = {
          name: data['project_name'] ?? project.name,
          client_id: data.client_id ?? project.client_id,
          consultant_id: data.consultant_id ?? project.consultant_id,
          project_type_id: data['journey'] ?? project.project_type_id,
          milestone_id: data.milestone_id ?? project.milestone_id,
          start_date: data.start_date ?? project.start_date,
          end_date: data.end_date?.length ? data.end_date : project.end_date,
          status: data.status ?? project.status,
          jurisdiction: data.jurisdiction ?? project.jurisdiction,
          visa_required: data.visa_required ?? project.visa_required,
          package: data.package ?? project.package,
          milestone_start_date: data['milestone_start_date'] ?? project.milestone_start_date,
          milestone_status: data['milestone_status'] ?? project.milestone_status,
          country: data.country ?? project.country,
          currency: data.currency ?? project.currency,
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

        if (!projectSettings) {
          await this.projectSettingsRepository.create({ company_id }, trx);
        }
      });

      const author = user?.name?.length > 0 ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id;

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.PROJECT_UPDATED,
        {
          user_id: user.id,
          company_id,
          description: 'Project updated',
          entity_description: `${author} updated project (${project.name})`,
          entity_id: project_id,
        },
        project_id,
      );

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
      const fieldName = field.name || field.slug;

      // Check if field is required
      if (field.is_required) {
        if (value === undefined || value === null || value === '') {
          // Use friendly field names for specific fields
          if (field.slug === 'project_client') {
            errors.push('Project client is required');
          } else if (field.slug === 'nationality') {
            errors.push('Nationality is required');
          } else if (field.slug === 'resident_country' || field.slug === 'resident country') {
            errors.push('Resident country is required');
          } else {
            errors.push(`${fieldName} is required`);
          }
          return;
        }
      }

      if (value === undefined || value === null || value === '') return;

      switch (field.type) {
        case 'select':
          // Check if it's a multiple select field that expects an array
          if (field.is_multiple) {
            if (!Array.isArray(value)) {
              // Use friendly field names for specific fields
              if (field.slug === 'project_client') {
                errors.push('Project client must be an array');
              } else {
                errors.push(`${fieldName} must be an array`);
              }
              return;
            }
            // Validate each value in the array if options are defined
            if (field.options && Array.isArray(field.options)) {
              value.forEach((val: any) => {
                if (!field.options!.includes(val)) {
                  errors.push(`Invalid value for ${fieldName}. Must be one of: ${field.options!.join(', ')}`);
                }
              });
            }
          } else {
            // Single select - check if value is in options
            if (field.options && !field.options.includes(value)) {
              errors.push(`Invalid value for ${fieldName}. Must be one of: ${field.options.join(', ')}`);
            }
          }
          break;
        case 'date':
          if (isNaN(new Date(value).getTime()) && field.is_required) {
            errors.push(`Invalid date format for ${fieldName}`);
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${fieldName} must be a number`);
          }
          break;
        case 'document':
          if (field.is_required && (!Array.isArray(value) || value.length === 0)) {
            errors.push(`At least one document is required for ${fieldName}`);
          }
          break;
        case 'text':
          // For text fields, ensure they're strings (not arrays)
          if (Array.isArray(value)) {
            // Use friendly field names for specific fields
            if (field.slug === 'nationality') {
              errors.push('Nationality must be a string');
            } else if (field.slug === 'resident_country' || field.slug === 'resident country') {
              errors.push('Resident country must be a string');
            } else {
              errors.push(`${fieldName} must be a string`);
            }
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

    const totalDurationDays = project?.project_type?.milestones?.map((ms) => ms?.duration ?? 0).reduce((a, b) => a + b, 0) ?? 0;

    return {
      ...project,
      timeline: override_value ?? this.calculateTimeline(project?.milestone?.duration ?? 0),
      project_timeline: this.calculateTimeline(totalDurationDays),
      total_duration_days: totalDurationDays,
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
