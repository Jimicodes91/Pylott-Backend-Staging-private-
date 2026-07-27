import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { DocumentAttachmentsRepository, DocumentsRepository, MetadataRepository, ProjectRepository, ProjectSettingsRepository } from '@/repositories';

import { UploadDocumentType } from '@/shared/types/dto/documents.dto';
import { ServiceType } from '@/shared/types/general.type';
import { DocumentsDirectory, MetadataType } from '@/shared/enums';

// Plain types to avoid circular dependencies
interface UserType {
  id: string;
  company_id: string;
  email: string;
  name?: string;
  role: string;
}

interface DocumentsType {
  id?: string;
  company_id: string;
  project_id: string;
  document_type_id?: string | null;
  name: string;
  task_id?: string;
  note_id?: string;
  type: MetadataType;
  description: string;
  is_visible_to_client: boolean;
  is_document_request: boolean;
  issue_date?: string | null;
  expiry_date?: string | null;
  does_not_expire?: boolean;
}

interface AttachmentsType {
  id?: string;
  document_id: string;
  field_id?: string;
  media_url: string | null;
}
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';

@injectable()
export class DocsService {
  private traceId = '[Document Service]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly documentRepository: DocumentsRepository,
    private readonly documentAttachmentRepository: DocumentAttachmentsRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly cloudinary: Cloudinary,
  ) {}

  public async uploadDocument(project_id: string, user: UserType, payload: UploadDocumentType): Promise<ServiceType> {
    const company_id = user.company_id;

    const { attachment, ...others } = payload;

    try {
      const isClient = user.role.toLowerCase() === 'client';

      if (payload.document_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.DOCUMENT,
          id: payload.document_type_id,
        };

        const eventType = await this.metadataRepository.findOne(metadataQuery);

        if (!eventType) return { status: false, message: 'Document type not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const project = await this.projectRepository.findOne({ id: project_id, company_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      const document_id = uuidv4();

      let attachmentUrl: null | string = null;

      const docFileName = others.file_name.trim().replaceAll(' ', '-');

      let isVisibleToClient = false;

      if (others.is_visible_to_client) isVisibleToClient = others.is_visible_to_client;
      if (isClient) isVisibleToClient = true;

      const documentData: Partial<DocumentsType> = {
        id: document_id,
        company_id,
        project_id,
        description: others.description,
        type: MetadataType.DOCUMENT,
        document_type_id: others?.document_type_id ?? null,
        name: others.file_name,
        is_visible_to_client: isVisibleToClient,

        issue_date: (payload as any).issue_date || null,
        expiry_date: (payload as any).expiry_date || null,
        does_not_expire: Boolean((payload as any).does_not_expire) || false,
      };
      if (payload.attachment && !payload.attachment.includes('http')) {
        const fileName = `${project_id}/${docFileName}`.toLowerCase();
        const { status, data } = await this.cloudinary.upload(DocumentsDirectory.DOCS, attachment, fileName);

        if (!status) return { status: false, message: 'Could not upload document. Please try again later', statusCode: 400 };
        attachmentUrl = data;
      }

      const documentAttachmentData: Partial<AttachmentsType> = {
        document_id,
        media_url: attachmentUrl,
      };

      await Objection.Model.transaction(async (trx) => {
        await this.documentRepository.create(documentData, trx);
        await this.documentAttachmentRepository.create(documentAttachmentData, trx);
      });

      return { status: true, message: 'Document uploaded successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred uploading docs ===> ${JSON.stringify({ ...others, err_msg: error?.message, err_stack: error?.stack?.slice(0, 200) })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async getDocumentDetails(project_id: string, document_id: string): Promise<ServiceType> {
    try {
      const document = await this.documentRepository.getDocumentAndAttachments(project_id, document_id);

      if (!document) return { status: false, message: 'Document not found', statusCode: StatusCodes.NOT_FOUND };

      return { status: true, message: 'Document details fetched successfully', data: document };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching docs details ===> ${JSON.stringify({ document_id, project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async getAllDocuments(user: UserType, project_id: string): Promise<ServiceType> {
    try {
      const isClient = user.role.toLowerCase() === 'client';

      const projectSettings = await this.projectSettingsRepository.getOne({ company_id: user.company_id, deleted_at: null });

      const isVisibleToClient = projectSettings?.client_can_view_documents;

      const documents = await this.documentRepository.getAllDocumentsAndAttachment(project_id, {}, isVisibleToClient, isClient);

      return { status: true, message: 'Project documents fetched successfully', data: documents };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching all project docs ===> ${JSON.stringify({ project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async deleteDocument(project_id: string, company_id: string, document_id: string): Promise<ServiceType> {
    try {
      const document = await this.documentRepository.findOne({ project_id, id: document_id, company_id });
      if (!document) return { status: false, message: 'Document not found', statusCode: StatusCodes.NOT_FOUND };

      await Objection.Model.transaction(async (trx) => {
        await this.documentAttachmentRepository.delete({ document_id }, true, trx);
        await this.documentRepository.delete({ id: document_id, company_id, project_id }, true, trx);
      });

      return { status: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred deleting documents ===> ${JSON.stringify({ project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async updateUploadedDocument(project_id: string, company_id: string, document_id: string, payload: Partial<UploadDocumentType>): Promise<ServiceType> {
    try {
      const document = await this.documentRepository.findOne({ project_id, id: document_id, company_id });
      if (!document) return { status: false, message: 'Document not found', statusCode: StatusCodes.NOT_FOUND };

      const updateData: Partial<DocumentsType> = {};

      if (payload.document_type_id && document.document_type_id === 'custom_field') {
        return { status: false, message: 'Cannot modify document_type_id for custom document' };
      }

      if (payload.document_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.DOCUMENT,
          id: payload.document_type_id,
        };
        const eventType = await this.metadataRepository.findOne(metadataQuery);
        if (!eventType) return { status: false, message: 'Document type not found', statusCode: StatusCodes.NOT_FOUND };

        updateData.document_type_id = payload.document_type_id;
      }

      const project = await this.projectRepository.findOne({ id: project_id, company_id });
      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      if (payload.description) updateData.description = payload.description;
      if (payload.file_name) updateData.name = payload.file_name.replaceAll(' ', '-');
      if (payload.is_visible_to_client !== null || payload.is_visible_to_client !== undefined) updateData.is_visible_to_client = payload.is_visible_to_client;

      await this.documentRepository.update({ id: document_id, project_id, company_id }, updateData);

      return { status: true, message: 'Document details updated successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred updating docs ===> ${JSON.stringify({ project_id, company_id, document_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async updateDocumentAttachment(project_id: string, company_id: string, document_id: string, attachment_id: string, payload: Pick<UploadDocumentType, 'attachment'>): Promise<ServiceType> {
    try {
      const document = await this.documentRepository.findOne({ project_id, id: document_id, company_id });
      if (!document) return { status: false, message: 'Document not found', statusCode: StatusCodes.NOT_FOUND };

      let attachmentUrl = payload.attachment;

      if (payload.attachment && !payload.attachment.includes('http')) {
        const fileName = `${project_id}/${document.name}`;
        const { status, data } = await this.cloudinary.upload(DocumentsDirectory.DOCS, payload.attachment, fileName);

        if (!status) return { status: false, message: 'Could not upload document. Please try again later', statusCode: 400 };
        attachmentUrl = data;
      }

      if (attachmentUrl) await this.documentAttachmentRepository.update({ document_id, id: attachment_id }, { media_url: attachmentUrl });

      return { status: true, message: 'Document details updated successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred updating docs ===> ${JSON.stringify({ project_id, company_id, document_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async deleteDocumentAttachment(project_id: string, company_id: string, document_id: string, attachment_id: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({ id: project_id, company_id });
      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      await this.documentAttachmentRepository.delete({ id: attachment_id, document_id }, false);

      return { status: true, message: 'Document attachment deleted successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred deleting doc attachment ===> ${JSON.stringify({ project_id, document_id, attachment_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
