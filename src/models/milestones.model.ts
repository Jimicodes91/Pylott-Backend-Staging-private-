import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Milestones extends BaseModel {
  static tableName = 'milestones';

  project_type_id: string;
  name: string;
  is_system: boolean;
  company_id: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type MilestonesModelType = ModelObject<Milestones>;
