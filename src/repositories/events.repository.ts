import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { Event, EventModelType } from '@/models';

@injectable()
export class EventsRepository extends BaseRepository<EventModelType, Event> {
  constructor() {
    super(Event);
  }

  async findOneWhereNameEquals(name: string, project_id: string, event_id: string) {
    return await this.model.query().where({ project_id, name }).where('id', '<>', event_id).whereNull('deleted_at').first();
  }
}
