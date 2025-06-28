import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { User } from './user.model';

export class ActivityLogs extends BaseModel {
  static tableName = 'activity_logs';

  company_id: string;
  user_id: string;
  project_id: string;
  name: string;
  entity: string;
  description: string;

  author: User;

  static relationMappings = (): ModelsRelationMapping => ({
    author: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: User,
      filter: (query) => query.select('id', 'name', 'email'),
      join: {
        from: 'activity_logs.user_id',
        to: 'users.id',
      },
    },
  });
}

export type ActivityLogsModelType = ModelObject<ActivityLogs>;
