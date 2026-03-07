import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { EventService } from './services/event.service';
import { EventDto } from '@/shared/types/dto/event.dto';
import { genericResponse } from '@/shared/utils/api-response';
import { EventStatus } from '@/shared/enums';
import { AuthenticatedRequest } from '@/shared/types/express';

// Plain type to avoid circular dependencies
interface UserType {
  id: string;
  company_id: string;
  email: string;
  name?: string;
  role: string;
}

@injectable()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  createEvent = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id } = req.params;
    const payload = req.body as EventDto;
    const user = req.user as UserType;
    const { statusCode = null, ...others } = await this.eventService.createEvent(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateEvent = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, event_id } = req.params;
    const payload = req.body as Partial<EventDto>;
    const user = req.user as UserType;
    const { statusCode = null, ...others } = await this.eventService.updateEvent(user, event_id, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteEvent = async (req: Request, res: Response) => {
    const { project_id, event_id } = req.params;
    const user = req.user as UserType;
    const { statusCode = null, ...others } = await this.eventService.deleteEvent(user, event_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getEventDetails = async (req: Request, res: Response) => {
    const { event_id, project_id } = req.params;
    const { statusCode = null, ...others } = await this.eventService.getEventDetails(req.user as UserType, event_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllEvents = async (req: Request, res: Response) => {
    const { project_id } = req.query;
    const { statusCode = null, ...others } = await this.eventService.getAllEvents(req.user as UserType, project_id as string);
    return genericResponse({ res, data: others, statusCode });
  };

  acceptEventInvite = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, event_id } = req.params;
    const user = req.user as UserType;

    const { statusCode = null, ...others } = await this.eventService.respondToEventInvite(user, event_id, project_id, EventStatus.ACCEPTED);
    return genericResponse({ res, data: others, statusCode });
  };

  declineEventInvite = async (req: AuthenticatedRequest, res: Response) => {
    const { project_id, event_id } = req.params;
    const user = req.user as UserType;

    const { statusCode = null, ...others } = await this.eventService.respondToEventInvite(user, event_id, project_id, EventStatus.DECLINED);
    return genericResponse({ res, data: others, statusCode });
  };
}
