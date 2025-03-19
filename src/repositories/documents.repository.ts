import { injectable } from 'tsyringe';

import { Documents, DocumentsModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class DocumentsRepository extends BaseRepository<DocumentsModelType, Documents> {
  constructor() {
    super(Documents);
  }
}
