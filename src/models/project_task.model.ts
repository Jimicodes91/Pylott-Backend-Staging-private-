import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { ProjectTaskStatus } from '@/shared/enums';
import { Documents } from './documents.model';
import { ProjectTaskAssignees } from './project_task_asignees.model';
import { ProjectType } from './project_type.model';
import { Metadata } from './metadata.model';
import { Company } from './company.model';

export class ProjectTask extends BaseModel {
  static tableName = 'project_tasks';

  project_id: string;
  company_id: string;
  author_id: string;
  task_type_id: string;
  name: string;
  description: string;
  status: ProjectTaskStatus;
  due_date: string;
  is_visible_to_client: boolean;
  signing_status?: string;
  form_config?: string;
  task_category_type?: string;
  contact_id?: string;
  priority?: string;

  assignees: Array<ProjectTaskAssignees>;
  project: any;

  static get relationMappings() {
    return {
      document: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./documents.model').Documents,
        join: {
          from: 'project_tasks.id',
          to: 'documents.task_id',
        },
      },
      company: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./company.model').Company,
        filter: (query) => query.select('id', 'name'),
        join: {
          from: 'project_tasks.company_id',
          to: 'companies.id',
        },
      },
      assignees: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./project_task_asignees.model').ProjectTaskAssignees,
        join: {
          from: 'project_tasks.id',
          to: 'project_task_assignees.task_id',
        },
      },
      task_type: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./metadata.model').Metadata,
        join: {
          from: 'project_tasks.task_type_id',
          to: 'metadata.id',
        },
      },
      pipeline: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./project_type.model').ProjectType,
        join: {
          from: 'project_tasks.project_type_id',
          to: 'project_types.id',
        },
      },
      project: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: __dirname + '/project.model',
        join: {
          from: 'project_tasks.project_id',
          to: 'projects.id',
        },
      },
      comments: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./task_comment.model').TaskComment,
        join: {
          from: 'project_tasks.id',
          to: 'task_comments.task_id',
        },
      },
      activity_log: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./task_activity_log.model').TaskActivityLog,
        join: {
          from: 'project_tasks.id',
          to: 'task_activity_log.task_id',
        },
      },
      contact: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./contact.model').Contact,
        filter: (query) => query.select('id', 'name', 'email', 'phone', 'organization'),
        join: {
          from: 'project_tasks.contact_id',
          to: 'contacts.id',
        },
      },
    };
  }
}

export type ProjectTaskModelType = ModelObject<ProjectTask>;
