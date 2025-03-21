import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

// @Oluwatunmise-olat
// @todo: event - invites
export class Event extends BaseModel {
  static tableName = 'events';

  project_id: string;
  event_type_id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  venue: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type EventModelType = ModelObject<Event>;
