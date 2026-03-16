import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class TaskClientResponses extends BaseModel {
  static tableName = 'task_client_responses';

  task_id: string;
  client_id: string;
  required_item: string;
  file_url: string | null;
  is_completed: boolean;
  comment: string | null;

  // Use require() inside getter to avoid circular reference stack overflow
  static get relationMappings() {
    return {
      task: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./project_task.model').ProjectTask,
        join: {
          from: 'task_client_responses.task_id',
          to: 'project_tasks.id',
        },
      },
      client: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./contact.model').Contact,
        filter: (query) => query.select('id', 'name', 'email'),
        join: {
          from: 'task_client_responses.client_id',
          to: 'contacts.id',
        },
      },
    };
  }
}

export type TaskClientResponsesModelType = ModelObject<TaskClientResponses>;
