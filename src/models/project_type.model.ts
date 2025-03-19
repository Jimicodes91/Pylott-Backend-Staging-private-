import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectType extends BaseModel {
  static tableName = 'project_type';

  name: string;
  is_system: boolean;
  company_id: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectTypeModelType = ModelObject<ProjectType>;
