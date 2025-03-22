import Objection from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { DocumentAttachmentsRepository, DocumentsRepository, MetadataRepository, ProjectRepository } from '@/repositories';

import { UploadDocumentType } from '@/shared/types/dto/documents.dto';
import { ServiceType } from '@/shared/types/general.type';
import { AttachmentsModelType, DocumentsModelType } from '@/models';
import { DocumentsDirectory, MetadataType } from '@/shared/enums';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';

@injectable()
export class DocsService {
  private traceId = '[Document Service]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly documentRepository: DocumentsRepository,
    private readonly documentAttachmentRepository: DocumentAttachmentsRepository,
    private readonly cloudinary: Cloudinary,
  ) {}

  public async uploadDocument(project_id: string, company_id: string, payload: UploadDocumentType): Promise<ServiceType> {
    const { attachment, ...others } = payload;

    try {
      const metadataQuery = {
        company_id,
        type: MetadataType.DOCUMENT,
        id: payload.document_type_id,
      };

      const eventType = await this.metadataRepository.findOne(metadataQuery);

      if (!eventType) return { status: false, message: 'Document type not found', statusCode: StatusCodes.NOT_FOUND };

      const project = await this.projectRepository.findOne({ id: project_id, company_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      const document_id = uuidv4();

      let attachmentUrl: null | string = null;

      // @ts-ignore
      const docFileName = others.file_name.trim().replaceAll(' ', '-');

      const documentData: Partial<DocumentsModelType> = {
        id: document_id,
        company_id,
        project_id,
        description: others.description,
        type: MetadataType.DOCUMENT,
        document_type_id: others.document_type_id,
        name: others.file_name,
      };
      if (payload.attachment && !payload.attachment.includes('http')) {
        const fileName = `${project_id}/${docFileName}`;
        const { status, data } = await this.cloudinary.upload(DocumentsDirectory.DOCS, attachment, fileName);

        if (!status) return { status: false, message: 'Could not upload document. Please try again later', statusCode: 400 };
        attachmentUrl = data;
      }

      const documentAttachmentData: Partial<AttachmentsModelType> = {
        document_id,
        media_url: attachmentUrl,
      };

      await Objection.Model.transaction(async (trx) => {
        await this.documentRepository.create(documentData, trx);
        await this.documentAttachmentRepository.create(documentAttachmentData, trx);
      });

      return { status: true, message: 'Document uploaded successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred uploading docs ===> ${JSON.stringify({ ...others, err_msg: error?.message })}`);
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

  public async getAllDocuments(project_id: string): Promise<ServiceType> {
    try {
      const documents = await this.documentRepository.getAllDocumentsAndAttachment(project_id);

      return { status: true, message: 'Project documents fetched successfully', data: documents };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching all project docs ===> ${JSON.stringify({ project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
