import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

// @todo @Oluwatunmise-olat Create this migration file
export class Event extends BaseModel {
  static tableName = 'events';

  project_id: string;
  event_type_id: string;
  created_by: string;
  name: string;
  start_datetime: string;
  end_datetime: string;
  description: string;
  venue: string;
  provider_identifier: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type EventModelType = ModelObject<Event>;
