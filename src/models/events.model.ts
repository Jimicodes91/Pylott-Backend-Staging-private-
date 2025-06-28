import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Event extends BaseModel {
  static tableName = 'events';

  project_id: string;
  company_id: string;
  event_type_id: string;
  created_by: string;
  name: string;
  start_datetime: string;
  end_datetime: string;
  description: string;
  venue: string;
  invites: string;
  provider_identifier: string;
  is_visible_to_client: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type EventModelType = ModelObject<Event>;
