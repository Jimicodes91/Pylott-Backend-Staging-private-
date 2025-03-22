import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { EventService } from './services/event.service';
import { EventDto } from '@/shared/types/dto/event.dto';
import { genericResponse } from '@/shared/utils/api-response';
import { UserModelType } from '@/models';

// @Todo event invites
// @accept event, decline event, set reminder
@injectable()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  createEvent = async (req: Request, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as EventDto;

    // @ts-ignore
    const user = req.user as UserModelType;
    const { statusCode = null, ...others } = await this.eventService.createEvent(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateEvent = async (req: Request, res: Response) => {
    const { project_id, event_id } = req.params;
    const payload = req.body as Partial<EventDto>;

    // @ts-ignore
    const user = req.user as UserModelType;
    const { statusCode = null, ...others } = await this.eventService.updateEvent(user.company_id, event_id, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteEvent = async (req: Request, res: Response) => {
    const { project_id, event_id } = req.params;
    const { statusCode = null, ...others } = await this.eventService.deleteEvent(event_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getEventDetails = async (req: Request, res: Response) => {
    const { event_id, project_id } = req.params;
    // @ts-ignore
    const { statusCode = null, ...others } = await this.eventService.getEventDetails(req.user as UserModelType, event_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllEvents = async (req: Request, res: Response) => {
    const { project_id } = req.params;
    // @ts-ignore
    const { statusCode = null, ...others } = await this.eventService.getAllEvents(req.user as UserModelType, project_id);
    return genericResponse({ res, data: others, statusCode });
  };
}
