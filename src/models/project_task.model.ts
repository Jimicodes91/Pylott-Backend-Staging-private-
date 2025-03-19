import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { ProjectTaskStatus } from '@/shared/enums';

export class ProjectTask extends BaseModel {
  static tableName = 'project_tasks';

  project_id: string;
  name: string;
  description: string;
  status: ProjectTaskStatus;
  assignee_id: string;
  start_date: string;
  end_date: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectTaskModelType = ModelObject<ProjectTask>;
