import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';

import { Documents, DocumentsModelType } from '@/models/documents.model';

@injectable()
export class DocumentsRepository extends BaseRepository<DocumentsModelType, Documents> {
  constructor() {
    super(Documents);
  }

  async getDocumentAndAttachments(project_id: string, document_id: string) {
    return await this.model
      .query()
      .where({ project_id, id: document_id, deleted_at: null })
      .first()
      .withGraphFetched('attachments')
      .modifyGraph('attachments', (qb) => {
        qb.whereNull('attachments.deleted_at');
      });
  }

  async getAllDocumentsAndAttachment(project_id: string, others: Partial<DocumentsModelType> = {}, is_visible_to_client: boolean, is_client = false) {
    let qb = this.model.query().where({ project_id, deleted_at: null, ...others });

    // Clients only see documents explicitly marked visible to them.
    if (is_client && is_visible_to_client) {
      qb = qb.where('is_visible_to_client', true);
    }

    return await qb.withGraphFetched('attachments').modifyGraph('attachments', (qb) => {
      qb.whereNull('attachments.deleted_at');
    });
  }
}
