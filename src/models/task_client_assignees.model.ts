import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class TaskClientAssignees extends BaseModel {
  static tableName = 'task_client_assignees';

  task_id: string;
  client_id: string;
  project_id: string;
  company_id: string;

  // Use require() inside getter to avoid circular reference stack overflow
  static get relationMappings() {
    return {
      task: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./project_task.model').ProjectTask,
        join: {
          from: 'task_client_assignees.task_id',
          to: 'project_tasks.id',
        },
      },
      client: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./contact.model').Contact,
        filter: (query) => query.select('id', 'name', 'email', 'phone', 'organization'),
        join: {
          from: 'task_client_assignees.client_id',
          to: 'contacts.id',
        },
      },
    };
  }
}

export type TaskClientAssigneesModelType = ModelObject<TaskClientAssignees>;
