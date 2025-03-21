import dayjs from 'dayjs';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { EventsRepository, MetadataRepository, ProjectRepository } from '@/repositories';

import { EventDto } from '@/shared/types/dto/event.dto';
import { MetadataType } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { EventModelType } from '@/models';

@injectable()
export class EventService {
  private traceId = '[Event Service]';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly eventRepository: EventsRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  public async createEvent(company_id: string, project_id: string, payload: EventDto): Promise<ServiceType> {
    try {
      const metadataQuery = {
        company_id,
        type: MetadataType.EVENT,
        id: payload.event_type_id,
      };

      const eventType = await this.metadataRepository.findOne(metadataQuery);

      if (!eventType) return { status: false, message: 'Event type not found', statusCode: StatusCodes.NOT_FOUND };

      const project = await this.projectRepository.findOne({ id: project_id, company_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      payload.name = payload.name.trim();

      const eventNameTaken = await this.eventRepository.findOne({ name: payload.name, project_id });

      if (eventNameTaken) return { status: false, message: 'Event with name already exists' };

      const insertData: Partial<EventModelType> = {
        ...payload,
        start_time: dayjs(payload.start_time).format(),
        end_time: dayjs(payload.end_time).format(),
        date: dayjs(payload.date).format(),
        project_id,
      };

      await this.eventRepository.create(insertData);

      return { status: true, message: 'Event created successfully', statusCode: StatusCodes.CREATED };
    } catch (error: any) {
      console.log(`${this.traceId} Error occurred creating event ===> ${JSON.stringify({ payload, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
