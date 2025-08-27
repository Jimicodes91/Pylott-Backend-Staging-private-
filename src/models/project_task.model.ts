import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { ProjectTaskStatus } from '@/shared/enums';
import { Documents } from './documents.model';
import { ProjectTaskAssignees } from './project_task_asignees.model';
import { ProjectType } from './project_type.model';
import { Metadata } from './metadata.model';
import { Company } from './company.model';
import { Project } from './project.model';

export class ProjectTask extends BaseModel {
  static tableName = 'project_tasks';

  project_id: string;
  company_id: string;
  author_id: string;
  task_type_id: string;
  project_type_id: string;
  name: string;
  description: string;
  status: ProjectTaskStatus;
  start_date: string;
  end_date: string;
  is_visible_to_client: boolean;

  assignees: Array<ProjectTaskAssignees>;
  project: Project;

  static relationMappings = (): ModelsRelationMapping => ({
    document: {
      relation: BaseModel.HasManyRelation,
      modelClass: Documents,
      join: {
        from: 'project_tasks.id',
        to: 'documents.task_id',
      },
    },
    company: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Company,
      filter: (query) => query.select('id', 'name'),
      join: {
        from: 'project_tasks.company_id',
        to: 'companies.id',
      },
    },
    assignees: {
      relation: BaseModel.HasManyRelation,
      modelClass: ProjectTaskAssignees,
      join: {
        from: 'project_tasks.id',
        to: 'project_task_assignees.task_id',
      },
    },
    task_type: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Metadata,
      join: {
        from: 'project_tasks.task_type_id',
        to: 'metadata.id',
      },
    },
    pipeline: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: ProjectType,
      join: {
        from: 'project_tasks.project_type_id',
        to: 'project_types.id',
      },
    },
    project: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Project,
      join: {
        from: 'project_tasks.project_id',
        to: 'projects.id',
      },
    },
  });
}

export type ProjectTaskModelType = ModelObject<ProjectTask>;
