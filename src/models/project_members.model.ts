import { ModelObject } from 'objection';

import { ModelsRelationMapping, RelationMapping } from '@/shared/types/models.type';
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

  user: User;

  static relationMappings = (): ModelsRelationMapping => ({
    user: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      filter: (query) => query.select('id', 'name', 'role', 'email'),
      join: {
        from: 'project_members.user_id',
        to: 'users.id',
      },
    } as RelationMapping<User>,
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
      filter: (query) => query.select('id', 'name', 'role', 'email'),
      join: {
        from: 'project_members.added_by',
        to: 'users.id',
      },
    } as RelationMapping<User>,
  });
}

export type ProjectMemebersModelType = ModelObject<ProjectMembers>;
