import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectNotes extends BaseModel {
  static tableName = 'project_notes';

  project_id: string;
  author_id: string;
  name: string;
  description: string;
  is_pinned: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectNotesModelType = ModelObject<ProjectNotes>;
