import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { ProjectTaskStatus } from '@/shared/enums';
import { Documents } from './documents.model';
import { User } from './user.model';

export class ProjectTask extends BaseModel {
  static tableName = 'project_tasks';

  project_id: string;
  company_id: string;
  author_id: string;
  name: string;
  description: string;
  status: ProjectTaskStatus;
  assignee_id: string;
  start_date: string;
  end_date: string;
  is_visible_to_client: boolean;

  static relationMappings = (): ModelsRelationMapping => ({
    document: {
      relation: BaseModel.HasManyRelation,
      modelClass: Documents,
      join: {
        from: 'projects_tasks.id',
        to: 'documents.task_id',
      },
    },
    assignee: {
      relation: BaseModel.HasManyRelation,
      modelClass: User,
      join: {
        from: 'projects_tasks.assignee_id',
        to: 'users.id',
      },
    },
  });
}

export type ProjectTaskModelType = ModelObject<ProjectTask>;
