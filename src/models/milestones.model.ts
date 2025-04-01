import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Project } from './project.model';

export class Milestones extends BaseModel {
  static tableName = 'milestones';

  project_type_id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  completed_at: string;
  name: string;
  is_system: boolean;

  projects: [Project];

  static relationMappings = (): ModelsRelationMapping => ({
    projects: {
      relation: BaseModel.HasManyRelation,
      modelClass: Project,
      join: {
        from: 'milestones.id',
        to: 'projects.milestone_id',
      },
    },
  });
}

export type MilestonesModelType = ModelObject<Milestones>;
