import { Response } from 'express';
import { injectable } from 'tsyringe';

import { DocsService } from './services/docs.service';
import { UploadDocumentType } from '@/shared/types/dto/documents.dto';
import { genericResponse } from '@/shared/utils/api-response';
import { AuthenticatedRequest } from '@/shared/types/express';
import { DocRequestService } from './services/docs-request.service';
import { DocumentRequestType } from '@/shared/types/projects.type';
import { UserModelType } from '@/models';

@injectable()
export class DocsController {
  constructor(
    private readonly docService: DocsService,
    private readonly docRequestService: DocRequestService,
  ) {}

  uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as UploadDocumentType;
    const user = req.user;
    const { statusCode = null, ...others } = await this.docService.uploadDocument(project_id, user.company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, document_id } = req.params;
    const user = req.user;
    const { statusCode = null, ...others } = await this.docService.deleteDocument(project_id, user.company_id, document_id);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteDocumentAttachment = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, document_id, attachment_id } = req.params;
    const user = req.user;
    const { statusCode = null, ...others } = await this.docService.deleteDocumentAttachment(project_id, user.company_id, document_id, attachment_id);
    return genericResponse({ res, data: others, statusCode });
  };

  updateDocumentUpload = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, document_id } = req.params;
    const payload = req.body as Partial<UploadDocumentType>;
    const user = req.user;
    const { statusCode = null, ...others } = await this.docService.updateUploadedDocument(project_id, user.company_id, document_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateDocumentAttachment = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, document_id, attachment_id } = req.params;
    const payload = req.body as Pick<UploadDocumentType, 'attachment'>;
    const user = req.user;
    const { statusCode = null, ...others } = await this.docService.updateDocumentAttachment(project_id, user.company_id, document_id, attachment_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  getDocumentDetails = async (req: AuthenticatedRequest, res: Response) => {
    const { document_id, project_id } = req.params;
    const { statusCode = null, ...others } = await this.docService.getDocumentDetails(project_id, document_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllDocuments = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id } = req.params;
    const { statusCode = null, ...others } = await this.docService.getAllDocuments(project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createDocumentRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as DocumentRequestType;
    const user = req.user;

    const { statusCode = null, ...others } = await this.docRequestService.createDocumentRequest(user as UserModelType, project_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };
}
