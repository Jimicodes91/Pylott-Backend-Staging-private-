import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectSettings extends BaseModel {
  static tableName = 'project_settings';

  company_id: string;
  client_can_view_task: boolean;
  client_can_view_notes: boolean;
  client_can_view_documents: boolean;
  client_can_view_activity: boolean;
  client_can_view_event: boolean;
  client_can_view_project_members: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectSettingsModelType = ModelObject<ProjectSettings>;
