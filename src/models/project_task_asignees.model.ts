import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';

export class ProjectTaskAssignees extends BaseModel {
  static tableName = 'project_task_assignees';

  project_id: string;
  company_id: string;
  assignee_id: string;
  task_id: string;
  user: User;

  static relationMappings = (): ModelsRelationMapping => ({
    user: {
      relation: BaseModel.HasManyRelation,
      modelClass: User,
      filter: (query) => query.select('id', 'name', 'role', 'email'),
      join: {
        from: 'project_task_assignees.assignee_id',
        to: 'users.id',
      },
    },
  });
}

export type ProjectTaskAssigneesModelType = ModelObject<ProjectTaskAssignees>;
