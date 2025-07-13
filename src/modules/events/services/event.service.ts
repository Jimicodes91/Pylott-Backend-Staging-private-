/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import dayjs from 'dayjs';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import { EventsRepository, MetadataRepository, ProjectMembersRepository, ProjectRepository, UserRepository } from '@/repositories';

import { EventDto } from '@/shared/types/dto/event.dto';
import { EmailSubject, MetadataType } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { EventModelType, UserModelType } from '@/models';
import { GoogleAPIsCalender } from '@/shared/utils/calender/gcal';
import { CreateCalenderEvent } from '@/shared/types/events.type';
import sendEmail from '@/shared/utils/nodemailer';
import { newEventScheduledEmail } from '@/shared/utils/email';
// import { dateTimeFormat } from '@/shared/constants/date.constants';

@injectable()
export class EventService {
  private traceId = '[Event Service]';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly eventRepository: EventsRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
    private readonly googleCalender: GoogleAPIsCalender,
    private readonly projectMemberRepository: ProjectMembersRepository,
  ) {}

  public async createEvent(user: UserModelType, project_id: string, payload: EventDto): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      if (payload.event_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.EVENT,
          id: payload.event_type_id,
          deleted_at: null,
        };

        const eventType = await this.metadataRepository.findOne(metadataQuery);

        if (!eventType) return { status: false, message: 'Event type not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const project = await this.projectRepository.findOne({ id: project_id, company_id, deleted_at: null });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      payload.name = payload.name.trim();

      const eventNameTaken = await this.eventRepository.findOne({ name: payload.name, project_id });

      if (eventNameTaken) return { status: false, message: 'Event with name already exists' };

      payload.start_datetime = dayjs(payload.start_datetime).format('YYYY-MM-DD HH:mm:ss');
      payload.end_datetime = dayjs(payload.end_datetime).format('YYYY-MM-DD HH:mm:ss');

      const gcalData: CreateCalenderEvent = {
        summary: payload.name,
        description: payload.description,
        location: payload.venue,
        startDateTime: payload.start_datetime,
        endDateTime: payload.end_datetime,
      };

      // const gcalResponse = await this.googleCalender.createEvent(gcalData, { email: user.email, displayName: user.name }, payload.invites);

      // if (!gcalResponse) return { status: false, message: 'Could not sync event at the moment' };

      const insertData: Partial<EventModelType> = {
        ...payload,
        start_datetime: payload.start_datetime,
        end_datetime: payload.end_datetime,
        project_id,
        // provider_identifier: gcalResponse.id,
        created_by: user.id,
        company_id: user.company_id,
        invites: JSON.stringify(Array.from(new Set([...payload.invites, user.email])) ?? []),
        is_visible_to_client: payload.is_visible_to_client,
      };

      await this.eventRepository.create(insertData);

      if (payload.invites && payload.invites.length) {
        const users = await this.userRepository.findAllWhereEmailIn(payload.invites);

        users.forEach(async (user) => {
          const emailSubject = `${EmailSubject.EVENT_CREATED} - ${payload.name}`;
          const email = newEventScheduledEmail(user.name, payload.name, payload.start_datetime, '');
          await sendEmail(user.email, emailSubject, email);
        });
      }

      const projectMembers = await this.projectMemberRepository.getInternalProjectMembersVisibleClients(project.id, user.company_id);
      if (projectMembers.length) {
        await projectMembers.forEach(async (pm) => {
          const { user } = pm;
          const emailSubject = `${EmailSubject.EVENT_CREATED} - ${payload.name}`;
          const email = newEventScheduledEmail(user.name, payload.name, payload.start_datetime, '');
          await sendEmail(user.email, emailSubject, email);
        });
      }

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
      const record = await this.eventRepository.findOne({ project_id, id: event_id, deleted_at: null });
      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      if (payload.event_type_id) {
        const metadataQuery = {
          company_id,
          type: MetadataType.EVENT,
          id: payload.event_type_id,
        };

        const eventType = await this.metadataRepository.findOne(metadataQuery);

        if (!eventType) return { status: false, message: 'Event type not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (payload.name) {
        payload.name = payload.name.trim();
      }

      if ((payload.start_datetime && !payload.end_datetime) || (payload.end_datetime && !payload.start_datetime)) {
        return { status: false, message: 'Fields `start_datetime` and `end_datetime` are required when performing updates' };
      }

      const updateData: Partial<EventModelType> = {};

      if (payload.start_datetime) updateData.start_datetime = dayjs(payload.start_datetime).format();
      if (payload.end_datetime) updateData.end_datetime = dayjs(payload.end_datetime).format();
      if (payload.is_visible_to_client !== null || payload.is_visible_to_client !== undefined) updateData.is_visible_to_client = payload.is_visible_to_client;

      if (payload.name) {
        const eventNameTaken = await this.eventRepository.findOneWhereNameEquals(payload.name, project_id, event_id);
        if (eventNameTaken) return { status: false, message: 'Event with name already exists' };
        updateData.name = payload.name;
      }

      if (payload.invites) updateData.invites = JSON.stringify(Array.from(new Set([...payload.invites])) ?? []);

      // const gcalData: Partial<CreateCalenderEvent> = {
      //   summary: payload?.name,
      //   description: payload?.description,
      //   location: payload?.venue,
      //   startDateTime: payload?.start_datetime,
      //   endDateTime: payload?.end_datetime,
      // };

      // const gcalResponse = await this.googleCalender.updateEvent(record.provider_identifier, gcalData, payload?.invites ?? []);

      // if (gcalResponse);
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

  public async getEventDetails(user: UserModelType, event_id: string, project_id: string): Promise<ServiceType> {
    try {
      const record = await this.eventRepository.findOne({ project_id, id: event_id, deleted_at: null });
      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      const formattedStartTime = dayjs(record.start_datetime).format('MMM DD YY, ha').toLowerCase();
      const formattedEndTime = dayjs(record.end_datetime).format('MMM DD YY, ha').toLowerCase();
      const formattedDate = dayjs(record.start_datetime).format('MMM DD, YYYY');

      // const gcalEvent = await this.googleCalender.getEvent(record.provider_identifier);
      // if (!gcalEvent) return { status: false, message: 'Could not retrieve event details', statusCode: 400 };

      // const attendees = gcalEvent.attendees || [];
      const attendees = JSON.parse(record.invites || '[]');

      const currentUserAttendee = attendees.find((attendee) => attendee.email === user.email);
      const userResponseStatus = currentUserAttendee ? currentUserAttendee.responseStatus : null;
      const isCreator = record.created_by === user.id;

      const formattedAttendees = attendees.map((attendee) => {
        return {
          email: attendee.email,
          name: attendee?.displayName || attendee?.email?.split('@')[0] || attendee?.split('@')[0],
          response_status: attendee.responseStatus || 'No Action',
          is_organizer: !!attendee.organizer,
          status_display: attendee.responseStatus,
        };
      });

      const { provider_identifier: _, ...eventData } = record;

      const responseData = {
        ...eventData,
        date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        invites: formattedAttendees,
        is_creator: isCreator,
        is_attendee: !!currentUserAttendee,
        user_response: userResponseStatus,
        attendance_stats: {
          total: attendees.length,
          accepted: attendees.filter((a) => a.responseStatus === 'accepted').length,
          declined: attendees.filter((a) => a.responseStatus === 'declined').length,
          tentative: attendees.filter((a) => a.responseStatus === 'tentative').length,
          no_response: attendees.filter((a) => !a.responseStatus || a.responseStatus === 'needsAction').length,
        },
      };

      return {
        status: true,
        message: 'Event details fetched successfully',
        data: responseData,
      };
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
      const record = await this.eventRepository.findOne({ project_id, id: event_id, deleted_at: null });

      if (!record) return { status: false, message: 'Event not found', statusCode: 404 };

      // const result = await this.googleCalender.deleteEvent(record.provider_identifier);

      // if (!result) return { status: false, message: 'Could not complete sync action, please try again later' };

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

  public async getAllEvents(user: UserModelType, project_id?: string): Promise<ServiceType> {
    try {
      const { company_id } = user;

      const queryData: Partial<EventModelType> = { company_id, deleted_at: null };

      if (project_id) queryData.project_id = project_id;

      const records = await this.eventRepository.findMany(queryData);

      const mappedRecords = await Promise.all(
        records.map(async (record) => {
          const formattedStartDatetime = dayjs(record.start_datetime).format('MMM DD YY, ha').toLowerCase();
          const formattedEndDatetime = dayjs(record.end_datetime).format('MMM DD YY, ha').toLowerCase();
          const formattedDate = dayjs(record.start_datetime).format('MMM DD, YYYY');

          const gcalEvent = await this.googleCalender.getEvent(record.provider_identifier);

          if (!gcalEvent) {
            return {
              ...record,
              start_datetime: formattedStartDatetime,
              end_datetime: formattedEndDatetime,
              date: formattedDate,
              invites: JSON.parse(record.invites),
              is_creator: record.created_by === user.id,
              is_attendee: false,
              user_response: null,
              attendance_stats: { total: 0, accepted: 0, declined: 0, tentative: 0, no_response: 0 },
            };
          }

          const attendees = gcalEvent.attendees || [];

          const currentUserAttendee = attendees.find((attendee) => attendee.email === user.email);
          const userResponseStatus = currentUserAttendee ? currentUserAttendee.responseStatus : null;

          const isCreator = record.created_by === user.id;

          const formattedAttendees = attendees.map((attendee) => {
            return {
              email: attendee.email,
              name: attendee.displayName || attendee.email.split('@')[0],
              response_status: attendee.responseStatus || 'needsAction',
              is_organizer: !!attendee.organizer,
              status_display: attendee.responseStatus,
            };
          });

          const attendanceStats = {
            total: attendees.length,
            accepted: attendees.filter((a) => a.responseStatus === 'accepted').length,
            declined: attendees.filter((a) => a.responseStatus === 'declined').length,
            tentative: attendees.filter((a) => a.responseStatus === 'tentative').length,
            no_response: attendees.filter((a) => !a.responseStatus || a.responseStatus === 'needsAction').length,
          };

          const { provider_identifier: _, ...eventData } = record;

          return {
            ...eventData,
            date: formattedDate,
            start_datetime: formattedStartDatetime,
            end_datetime: formattedEndDatetime,
            invites: formattedAttendees,
            is_creator: isCreator,
            is_attendee: !!currentUserAttendee,
            user_response: userResponseStatus,
            attendance_stats: attendanceStats,
          };
        }),
      );

      return {
        status: true,
        message: 'All events fetched successfully',
        data: mappedRecords,
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching events ===> ${JSON.stringify({ project_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  /**
   * Updates the user's response to an event invitation
   * @param user Current user
   * @param event_id Event ID
   * @param project_id Project ID
   * @param response Response status ('accepted', 'declined', 'tentative')
   */
  public async respondToEventInvite(user: UserModelType, event_id: string, project_id: string, response: 'accepted' | 'declined' | 'tentative'): Promise<ServiceType> {
    try {
      const record = await this.eventRepository.findOne({ project_id, id: event_id, deleted_at: null });
      if (!record)
        return {
          status: false,
          message: 'Event not found',
          statusCode: StatusCodes.NOT_FOUND,
        };

      const gcalEvent = await this.googleCalender.getEvent(record.provider_identifier);
      if (!gcalEvent)
        return {
          status: false,
          message: 'Could not sync event details, please try again later',
          statusCode: StatusCodes.BAD_REQUEST,
        };

      const attendees = gcalEvent.attendees || [];
      const userIndex = attendees.findIndex((attendee) => attendee.email === user.email);

      if (userIndex === -1)
        return {
          status: false,
          message: 'You are not invited to this event',
          statusCode: StatusCodes.BAD_REQUEST,
        };

      const result = await this.googleCalender.respondToEvent(record.provider_identifier, user.email, response);

      if (!result)
        return {
          status: false,
          message: 'Could not update invitation response',
        };

      return {
        status: true,
        message: `Successfully ${response} the invitation`,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error responding to event invite ===> ${JSON.stringify({
          event_id,
          project_id,
          response,
          user_email: user.email,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
