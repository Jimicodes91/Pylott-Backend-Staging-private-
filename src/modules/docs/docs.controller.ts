import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { DocsService } from './services/docs.service';
import { UploadDocumentType } from '@/shared/types/dto/documents.dto';
import { genericResponse } from '@/shared/utils/api-response';

// @todo - Document request
@injectable()
export class DocsController {
  constructor(private readonly docService: DocsService) {}

  uploadDocument = async (req: Request, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as UploadDocumentType;

    // @ts-ignore
    const user = req.user;

    const { statusCode = null, ...others } = await this.docService.uploadDocument(project_id, user.company_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };

  getDocumentDetails = async (req: Request, res: Response) => {
    const { document_id, project_id } = req.params;

    const { statusCode = null, ...others } = await this.docService.getDocumentDetails(project_id, document_id);

    return genericResponse({ res, data: others, statusCode });
  };

  getAllDocuments = async (req: Request, res: Response) => {
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.docService.getAllDocuments(project_id);

    return genericResponse({ res, data: others, statusCode });
  };
}
