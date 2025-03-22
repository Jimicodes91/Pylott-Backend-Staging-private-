/* eslint-disable prefer-const */
import dayjs from 'dayjs';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

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
  public async updateEvent(company_id: string, event_id: string, project_id: string, payload: Partial<EventDto>): Promise<ServiceType> {
    try {
      const record = await this.eventRepository.findOne({ project_id, id: event_id });
      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      const metadataQuery = {
        company_id,
        type: MetadataType.EVENT,
        id: payload.event_type_id,
      };

      const eventType = await this.metadataRepository.findOne(metadataQuery);
      if (!eventType) return { status: false, message: 'Event type not found', statusCode: StatusCodes.NOT_FOUND };

      payload.name = payload.name.trim();
      const eventNameTaken = await this.eventRepository.findOne({ name: payload.name, project_id });
      if (eventNameTaken) return { status: false, message: 'Event with name already exists' };

      if ((payload.start_time && !payload.end_time) || (payload.end_time && !payload.start_time)) {
        return { status: false, message: 'Fields `start_time` and `end_time` are required when performing updates' };
      }

      const updateData: Partial<EventModelType> = {};

      if (payload.start_time) updateData.start_time = dayjs(payload.start_time).format();
      if (payload.end_time) updateData.end_time = dayjs(payload.end_time).format();
      if (payload.date) updateData.date = dayjs(payload.date).format();

      if (payload.name) {
        const eventNameTaken = await this.eventRepository.findOne({ name: payload.name, project_id });
        if (eventNameTaken) return { status: false, message: 'Event with name already exists' };
      }

      await this.eventRepository.update({ id: event_id, project_id }, updateData);

      return { status: true, message: 'Event updated successfully', statusCode: StatusCodes.OK };
    } catch (error: any) {
      console.log(`${this.traceId} Error occurred updating event ===> ${JSON.stringify({ payload, event_id, company_id, project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async getEventDetails(event_id: string, project_id: string): Promise<ServiceType> {
    try {
      const record = await this.eventRepository.findOne({ project_id, id: event_id });

      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      record.start_time = dayjs(record.start_time).format('ha').toLowerCase();

      record.end_time = dayjs(record.end_time).format('ha').toLowerCase();

      record.date = dayjs(record.date).format('MMMM	DD');

      return { status: true, message: 'Event details fetched successfully', data: record };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching event details ===> ${JSON.stringify({ event_id, project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async deleteEvent(event_id: string, project_id: string): Promise<ServiceType> {
    try {
      const record = await this.eventRepository.findOne({ project_id, id: event_id });

      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      await this.eventRepository.delete({ id: event_id, project_id }, true);

      return { status: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error occurred deleting event ===> ${JSON.stringify({ event_id, project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  public async getAllEvents(project_id: string): Promise<ServiceType> {
    try {
      const records = await this.eventRepository.findMany({ project_id });

      const mappedRecords = records.map((record) => {
        let { start_time, end_time, date, ...others } = record;

        start_time = dayjs(start_time).format('ha').toLowerCase();

        end_time = dayjs(end_time).format('ha').toLowerCase();

        date = dayjs(date).format('MMMM	DD');

        return { ...others, start_time, end_time, date };
      });

      return { status: true, message: 'All events fetched successfully', data: mappedRecords };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching events ===> ${JSON.stringify({ project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
