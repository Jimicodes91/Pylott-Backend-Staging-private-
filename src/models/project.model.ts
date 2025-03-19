import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Project extends BaseModel {
  static tableName = 'projects';

  client_id: string;
  company_id: string;
  consultant_id: string;
  milestone_id: string;
  stage_id: string;
  project_type_id: string;
  status: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  completed_at: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectModelType = ModelObject<Project>;
