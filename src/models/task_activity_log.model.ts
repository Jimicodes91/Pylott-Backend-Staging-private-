import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class TaskActivityLog extends BaseModel {
  static tableName = 'task_activity_log';

  task_id: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  user_id: string;
  metadata?: string;
  company_id: string;

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./user.model').User,
        filter: (query: any) => query.select('id', 'name'),
        join: { from: 'task_activity_log.user_id', to: 'users.id' },
      },
    };
  }
}

export type TaskActivityLogModelType = ModelObject<TaskActivityLog>;
