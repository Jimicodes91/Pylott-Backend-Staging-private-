import dayjs from 'dayjs';
import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { DocumentRequestsRepository } from '@/repositories/document_request.repository';
import { MetadataRepository, ProjectRepository, ProjectTaskRepository, ProjectMembersRepository, UserRepository } from '@/repositories';

import { UserModelType } from '@/models';
import { DocumentRequestType } from '@/shared/types/projects.type';
import { ServiceType } from '@/shared/types/general.type';
import { AUDIT_TRAIL_ACTION, EmailSubject, MetadataType, ProjectTaskStatus } from '@/shared/enums';
import sendEmail from '@/shared/utils/nodemailer';
import { documentRequestEmail } from '@/shared/utils/email';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

// @todo Ask frontend for all mailing destination urls

@injectable()
export class DocRequestService {
  private traceId = '[Document Request Service]';

  constructor(
    private readonly documentRequestRepository: DocumentRequestsRepository,
    private readonly taskRepository: ProjectTaskRepository,
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
      };

      const eventType = await this.metadataRepository.findOne(metadataQuery);

      if (!eventType) return { status: false, message: 'Document type not found', statusCode: StatusCodes.NOT_FOUND };

      const projectMember = await this.projectMemberRepository.findOne({ user_id: payload.assignee_id, project_id });

      if (!projectMember) return { status: false, message: 'Cannot assign request to non-project member' };

      const project = await this.projectRepository.findOne({ id: project_id, company_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      const docReqId = uuidv4();
      const taskId = uuidv4();

      await Objection.Model.transaction(async (trx) => {
        await this.taskRepository.create(
          {
            id: taskId,
            assignee_id: payload.assignee_id,
            author_id: user.id,
            company_id,
            description: payload?.description,
            is_visible_to_client: payload.is_visible_to_client,
            name: payload.name,
            project_id,
            status: ProjectTaskStatus.PENDING,
            start_date: dayjs().format(),
            end_date: dayjs(payload.end_date).format(),
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
          entity_description: user.name.replace(/^./, (c) => c.toUpperCase()),
          entity_id: taskId,
        },
        project_id,
      );

      const emailSubject = `${EmailSubject.DOCUMENT_REQUEST}: ${payload.name}`;
      const taskAuthor = await this.userRepository.findOne({ id: payload.assignee_id });
      const email = documentRequestEmail(taskAuthor.name, user.name, project.name, payload.name, payload.description, '');
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
