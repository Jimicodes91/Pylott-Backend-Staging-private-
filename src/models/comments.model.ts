import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Comments extends BaseModel {
  static tableName = 'project_notes';

  project_id: string;
  note_id: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type CommentsModelType = ModelObject<Comments>;
