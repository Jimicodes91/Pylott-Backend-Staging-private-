import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectSettings extends BaseModel {
  static tableName = 'project_settings';

  project_id: string;
  company_id: string;
  client_can_view_task: boolean;
  client_can_view_notes: boolean;
  client_can_view_documents: boolean;
  client_can_view_activity: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectSettingsModelType = ModelObject<ProjectSettings>;
