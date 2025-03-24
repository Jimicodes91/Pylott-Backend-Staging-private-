import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ActivityLogs extends BaseModel {
  static tableName = 'activity_logs';

  company_id: string;
  user_id: string;
  project_id: string;
  name: string;
  entity: string;
  description: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ActivityLogsModelType = ModelObject<ActivityLogs>;
