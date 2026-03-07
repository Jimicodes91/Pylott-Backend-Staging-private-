import dayjs from 'dayjs';
import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { DocumentRequestsRepository } from '@/repositories/document_request.repository';
import { MetadataRepository, ProjectRepository, ProjectTaskRepository, ProjectMembersRepository, UserRepository, ProjectTaskAssigneesRepository } from '@/repositories';

import { MetadataModelType } from '@/models/metadata.model';
import { UserModelType } from '@/models/user.model';
import { DocumentRequestType } from '@/shared/types/projects.type';
import { ServiceType } from '@/shared/types/general.type';
import { AUDIT_TRAIL_ACTION, EmailSubject, MetadataType, ProjectTaskStatus } from '@/shared/enums';
import sendEmail from '@/shared/utils/nodemailer';
import { documentRequestEmail } from '@/shared/utils/email';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';
import { FRONTEND_URL } from '@/config/env';

// @todo Ask frontend for all mailing destination urls

@injectable()
export class DocRequestService {
  private traceId = '[Document Request Service]';

  constructor(
    private readonly documentRequestRepository: DocumentRequestsRepository,
    private readonly taskRepository: ProjectTaskRepository,
    private readonly projectTaskAssigneesRepository: ProjectTaskAssigneesRepository,
    private readonly userRepository: UserRepository,
    private readonly projectMemberRepository: ProjectMembersRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async createDocumentRequest(user: UserModelType, project_id: string, payload: DocumentRequestType): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const metadataQuery = {
        company_id,
        type: MetadataType.DOCUMENT,
        id: payload.document_type_id,
        deleted_at: null,
      };

      const docRequestMetadataQuery: Partial<MetadataModelType> = {
        company_id,
        type: MetadataType.TASK,
        deleted_at: null,
        is_system: true,
      };

      const eventType = await this.metadataRepository.findOne(metadataQuery);

      if (!eventType) return { status: false, message: 'Document type not found', statusCode: StatusCodes.NOT_FOUND };

      const projectMember = await this.projectMemberRepository.findOne({ user_id: payload.assignee_id, project_id });

      if (!projectMember) return { status: false, message: 'Cannot assign request to non-project member' };

      const project = await this.projectRepository.findOne({ id: project_id, company_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      let docRequestMetadataType = await this.metadataRepository.findOne(docRequestMetadataQuery);

      if (!docRequestMetadataType) {
        const data: Partial<MetadataModelType> = {
          ...docRequestMetadataQuery,
          name: 'Document Request',
          description: 'Task type for document requests',
        };
        docRequestMetadataType = await this.metadataRepository.create(data);
      }

      const docReqId = uuidv4();
      const taskId = uuidv4();

      await Objection.Model.transaction(async (trx) => {
        await this.taskRepository.create(
          {
            id: taskId,
            author_id: user.id,
            company_id,
            description: payload?.description,
            is_visible_to_client: payload.is_visible_to_client,
            name: payload.name,
            project_id,
            status: ProjectTaskStatus.PENDING,
            start_date: dayjs().format(),
            end_date: dayjs(payload.end_date).format(),
            task_type_id: docRequestMetadataType.id,
            project_type_id: project.project_type_id,
          },
          trx,
        );

        await this.projectTaskAssigneesRepository.create(
          {
            assignee_id: payload.assignee_id,
            task_id: taskId,
            company_id,
            project_id,
          },
          trx,
        );

        await this.documentRequestRepository.create(
          {
            id: docReqId,
            task_id: taskId,
            assignee_id: payload.assignee_id,
            company_id,
            description: payload?.description,
            is_visible_to_client: payload.is_visible_to_client,
            project_id,
            name: payload.name,
            document_type_id: payload.document_type_id,
          },
          trx,
        );
      });

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.TASK_ADDED,
        {
          user_id: user.id,
          company_id,
          description: 'Task added',
          entity_description: user?.name?.length ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id,
          entity_id: taskId,
        },
        project_id,
      );

      const emailSubject = `${EmailSubject.DOCUMENT_REQUEST}: ${payload.name}`;
      const taskAuthor = await this.userRepository.findOne({ id: payload.assignee_id });
      const projectLink = `${FRONTEND_URL}/projects/${project_id}`;
      const email = documentRequestEmail(taskAuthor.name, user.name, project.name, payload.name, payload.description, projectLink);
      await sendEmail(taskAuthor.email, emailSubject, email);

      return { status: true, message: 'Document request created successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred uploading docs ===> ${JSON.stringify({ payload, project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
