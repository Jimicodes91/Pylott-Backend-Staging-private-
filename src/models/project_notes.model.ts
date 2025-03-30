import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Documents } from './documents.model';
import { User } from './user.model';

export class ProjectNotes extends BaseModel {
  static tableName = 'project_notes';

  project_id: string;
  company_id: string;
  author_id: string;
  content: string;
  metadata?: string;

  static relationMappings = (): ModelsRelationMapping => ({
    document: {
      relation: BaseModel.HasManyRelation,
      modelClass: Documents,
      join: {
        from: 'projects_notes.id',
        to: 'documents.note_id',
      },
    },
    author: {
      relation: BaseModel.HasManyRelation,
      modelClass: User,
      join: {
        from: 'projects_notes.author_id',
        to: 'users.id',
      },
    },
  });
}

export type ProjectNotesModelType = ModelObject<ProjectNotes>;
