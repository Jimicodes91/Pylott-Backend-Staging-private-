import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { EventService } from './services/event.service';
import { EventDto } from '@/shared/types/dto/event.dto';
import { genericResponse } from '@/shared/utils/api-response';

// @Todo event invites
// @accept event, decline event, set reminder
@injectable()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  createEvent = async (req: Request, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as EventDto;

    // @ts-ignore
    const user = req.user;

    const { statusCode = null, ...others } = await this.eventService.createEvent(user.company_id, project_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };

  getEventDetails = async (req: Request, res: Response) => {
    const { event_id, project_id } = req.params;

    const { statusCode = null, ...others } = await this.eventService.getEventDetails(event_id, project_id);

    return genericResponse({ res, data: others, statusCode });
  };

  getAllEvents = async (req: Request, res: Response) => {
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.eventService.getAllEvents(project_id);

    return genericResponse({ res, data: others, statusCode });
  };
}
