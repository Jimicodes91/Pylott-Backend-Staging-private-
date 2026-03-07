import { injectable } from 'tsyringe';

import { Attachments, AttachmentsModelType } from '@/models/document_attachments.model';
import BaseRepository from './base.repository';

@injectable()
export class DocumentAttachmentsRepository extends BaseRepository<AttachmentsModelType, Attachments> {
  constructor() {
    super(Attachments);
  }
}
