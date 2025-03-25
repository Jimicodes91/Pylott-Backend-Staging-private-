import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { MileStoneStages } from './milestone_stages.model';

export class Milestones extends BaseModel {
  static tableName = 'milestones';

  project_type_id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  completed_at: string;
  name: string;
  is_system: boolean;

  static relationMappings = (): ModelsRelationMapping => ({
    stages: {
      relation: BaseModel.HasManyRelation,
      modelClass: MileStoneStages,
      join: {
        from: 'milestones.id',
        to: 'milestone_stages.milestone_id',
      },
    },
  });
}

export type MilestonesModelType = ModelObject<Milestones>;
