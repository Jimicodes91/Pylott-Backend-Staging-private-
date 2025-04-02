import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';

import { Documents, DocumentsModelType } from '@/models';

@injectable()
export class DocumentsRepository extends BaseRepository<DocumentsModelType, Documents> {
  constructor() {
    super(Documents);
  }

  async getDocumentAndAttachments(project_id: string, document_id: string) {
    return await this.model.query().where({ project_id, id: document_id }).first().withGraphFetched('attachments');
  }

  async getAllDocumentsAndAttachment(project_id: string) {
    return await this.model.query().where({ project_id }).withGraphFetched('attachments');
  }
}
