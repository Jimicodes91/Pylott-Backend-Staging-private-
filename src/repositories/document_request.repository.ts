import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { DocumentRequests, DocumentRequestsModelType } from '@/models';

@injectable()
export class DocumentRequestsRepository extends BaseRepository<DocumentRequestsModelType, DocumentRequests> {
  constructor() {
    super(DocumentRequests);
  }
}
