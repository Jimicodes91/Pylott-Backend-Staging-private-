import { injectable } from 'tsyringe';

import { EventService } from './services/event.service';

@injectable()
export class EventController {
  constructor(private readonly eventService: EventService) {}
}
