import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Comments extends BaseModel {
  static tableName = 'comments';

  project_id: string;
  author_id: string;
  note_id: string;
  content: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type CommentsModelType = ModelObject<Comments>;
