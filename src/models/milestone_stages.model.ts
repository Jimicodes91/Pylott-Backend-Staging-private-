import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class MileStoneStages extends BaseModel {
  static tableName = 'milestone_stages';

  milestone_id: string;
  company_id: string;
  name: string;
  is_system: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type MileStoneStagesModelType = ModelObject<MileStoneStages>;
