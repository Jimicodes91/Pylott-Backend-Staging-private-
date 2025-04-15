import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Client } from './client.model';
import { Consultant } from './consultant.model';
import { Milestones } from './milestones.model';
import { ProjectType } from './project_type.model';
import { ProjectTask } from './project_task.model';
import { ProjectNotes } from './project_notes.model';
import { Documents } from './documents.model';

export class Project extends BaseModel {
  static tableName = 'projects';

  client_id?: string;
  company_id: string;
  consultant_id?: string;
  milestone_id?: string;
  project_type_id: string;
  status: string;
  name: string;
  start_date: string;
  end_date: string;
  completed_at: string;
  created_by: string;
  jurisdiction?: string;
  visa_required?: string;
  package?: string;
  form_data: any;

  documents: Array<Documents>;
  project_type: ProjectType;

  static relationMappings = (): ModelsRelationMapping => ({
    client: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Client,
      join: {
        from: 'projects.client_id',
        to: 'clients.id',
      },
    },
    project_type: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: ProjectType,
      join: {
        from: 'projects.project_type_id',
        to: 'project_types.id',
      },
    },
    consultant: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Consultant,
      join: {
        from: 'projects.consultant_id',
        to: 'consultants.id',
      },
    },
    milestone: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: Milestones,
      join: {
        from: 'projects.milestone_id',
        to: 'milestones.id',
      },
    },
    tasks: {
      relation: BaseModel.HasManyRelation,
      modelClass: ProjectTask,
      join: {
        from: 'projects.id',
        to: 'project_tasks.project_id',
      },
    },
    notes: {
      relation: BaseModel.HasManyRelation,
      modelClass: ProjectNotes,
      join: {
        from: 'projects.id',
        to: 'project_notes.project_id',
      },
    },
    events: {
      relation: BaseModel.HasManyRelation,
      modelClass: Event,
      join: {
        from: 'projects.id',
        to: 'events.project_id',
      },
    },
    documents: {
      relation: BaseModel.HasManyRelation,
      modelClass: Documents,
      join: {
        from: 'projects.id',
        to: 'documents.project_id',
      },
    },
  });
}

export type ProjectModelType = ModelObject<Project>;
