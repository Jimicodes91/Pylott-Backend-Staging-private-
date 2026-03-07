import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { DocumentRequests, DocumentRequestsModelType } from '@/models/document_request.model';

@injectable()
export class DocumentRequestsRepository extends BaseRepository<DocumentRequestsModelType, DocumentRequests> {
  constructor() {
    super(DocumentRequests);
  }
}
