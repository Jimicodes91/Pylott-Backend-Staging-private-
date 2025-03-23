import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';
import { Project } from './project.model';

export class ProjectMembers extends BaseModel {
  static tableName = 'project_members';

  company_id: string;
  project_id: string;
  user_id: string;
  is_visible_to_client: boolean;
  added_by: string;

  static relationMappings = (): ModelsRelationMapping => ({
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_members.user_id',
        to: 'users.id',
      },
    },
    project: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Project,
      join: {
        from: 'project_members.project_id',
        to: 'projects.id',
      },
    },
    creator: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'project_members.added_by',
        to: 'users.id',
      },
    },
  });
}

export type ProjectMemebersModelType = ModelObject<ProjectMembers>;
