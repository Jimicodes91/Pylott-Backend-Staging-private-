import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Consultant } from './consultant.model';
import { ProjectNotes } from './project_notes.model';
import { Documents } from './documents.model';
import { ProjectSettings } from './project_settings.model';
import { Event } from './events.model';

export class Project extends BaseModel {
  static tableName = 'projects';

  client_id?: string;
  company_id: string;
  consultant_id?: string;
  milestone_id?: string;
  milestone_start_date?: string;
  milestone_status?: string;
  project_type_id: string;
  status: string;
  name: string;
  start_date: string;
  end_date?: string;
  completed_at: string;
  created_by: string;
  jurisdiction?: string;
  visa_required?: string;
  package?: string;
  form_data: any;
  currency?: string;
  country?: string;

  documents: Array<Documents>;
  project_type: any;
  milestone: any;
  members: Array<any>;
  setting: ProjectSettings;

  // Temporarily disabled to break circular dependencies
  // static get relationMappings() {
  //   return {
  //     client: {
  //       relation: BaseModel.BelongsToOneRelation,
  //       modelClass: __dirname + '/client.model',
  //       join: {
  //         from: 'projects.client_id',
  //         to: 'clients.id',
  //       },
  //     },
  //     project_type: {
  //       relation: BaseModel.BelongsToOneRelation,
  //       modelClass: __dirname + '/project_type.model',
  //       join: {
  //         from: 'projects.project_type_id',
  //         to: 'project_types.id',
  //       },
  //     },
  //     consultant: {
  //       relation: BaseModel.BelongsToOneRelation,
  //       modelClass: Consultant,
  //       join: {
  //         from: 'projects.consultant_id',
  //         to: 'consultants.id',
  //       },
  //     },
  //     milestone: {
  //       relation: BaseModel.BelongsToOneRelation,
  //       modelClass: __dirname + '/milestones.model',
  //       join: {
  //         from: 'projects.milestone_id',
  //         to: 'milestones.id',
  //       },
  //     },
  //     tasks: {
  //       relation: BaseModel.HasManyRelation,
  //       modelClass: __dirname + '/project_task.model',
  //       join: {
  //         from: 'projects.id',
  //         to: 'project_tasks.project_id',
  //       },
  //     },
  //     notes: {
  //       relation: BaseModel.HasManyRelation,
  //       modelClass: ProjectNotes,
  //       join: {
  //         from: 'projects.id',
  //         to: 'project_notes.project_id',
  //       },
  //     },
  //     events: {
  //       relation: BaseModel.HasManyRelation,
  //       modelClass: Event,
  //       join: {
  //         from: 'projects.id',
  //         to: 'events.project_id',
  //         },
  //     },
  //     members: {
  //       relation: BaseModel.HasManyRelation,
  //       modelClass: __dirname + '/project_members.model',
  //       join: {
  //         from: 'projects.id',
  //         to: 'project_members.project_id',
  //       },
  //     },
  //     documents: {
  //       relation: BaseModel.HasManyRelation,
  //       modelClass: Documents,
  //       join: {
  //         from: 'projects.id',
  //         to: 'documents.project_id',
  //       },
  //     },
  //     setting: {
  //       relation: BaseModel.BelongsToOneRelation,
  //       modelClass: ProjectSettings,
  //       join: {
  //         from: 'projects.company_id',
  //         to: 'project_settings.company_id',
  //       },
  //     },
  //   };
  // }
}

export type ProjectModelType = ModelObject<Project>;
