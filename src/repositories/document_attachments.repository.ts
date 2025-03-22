import { injectable } from 'tsyringe';

import { Attachments, AttachmentsModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class DocumentAttachmentsRepository extends BaseRepository<AttachmentsModelType, Attachments> {
  constructor() {
    super(Attachments);
  }
}
