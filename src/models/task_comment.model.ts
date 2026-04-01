import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class TaskComment extends BaseModel {
  static tableName = 'task_comments';

  task_id: string;
  author_id: string;
  content: string;
  company_id: string;

  static get relationMappings() {
    return {
      author: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./user.model').User,
        filter: (query: any) => query.select('id', 'name', 'email'),
        join: { from: 'task_comments.author_id', to: 'users.id' },
      },
    };
  }
}

export type TaskCommentModelType = ModelObject<TaskComment>;
