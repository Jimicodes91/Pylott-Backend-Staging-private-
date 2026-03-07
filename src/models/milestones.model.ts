import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Milestones extends BaseModel {
  static tableName = 'milestones';

  project_type_id: string;
  company_id: string;
  duration: number;
  completed_at: string;
  name: string;
  is_system: boolean;
  order: number;

  projects: Array<any>;

  static get relationMappings() {
    return {
      projects: {
        relation: BaseModel.HasManyRelation,
        modelClass: __dirname + '/project.model',
        join: {
          from: 'milestones.id',
          to: 'projects.milestone_id',
        },
      },
    };
  }
}

export type MilestonesModelType = ModelObject<Milestones>;
