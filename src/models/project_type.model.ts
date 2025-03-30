import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectType extends BaseModel {
  static tableName = 'project_types';

  company_id: string;
  name: string;
  slug: string;
  is_system: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectTypeModelType = ModelObject<ProjectType>;
