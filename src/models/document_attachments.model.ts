import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Attachments extends BaseModel {
  static tableName = 'attachments';

  document_id: string;
  media_url: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type AttachmentsModelType = ModelObject<Attachments>;
