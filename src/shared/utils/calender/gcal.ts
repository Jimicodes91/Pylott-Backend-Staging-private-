import { GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { calendar_v3, google } from 'googleapis';
import * as path from 'path';
import { injectable } from 'tsyringe';

import { EventStatus } from '@/shared/enums';
import { ObjectLiteral } from '@/shared/types/general.type';
import { CreateCalenderEvent, EventOrganizer } from '@/shared/types/events.type';

@injectable()
export class GoogleAPIsCalender {
  private traceId = '[Google APIs]';
  private calendar: calendar_v3.Calendar;
  private auth: GoogleAuth<JSONClient>;
  private readonly keyfilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || path.join(__dirname, '../config/service-account-key.json');

  constructor() {
    this.auth = this.googleClient();
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.auth,
    });
  }

  /**
   * Create a calendar event
   * @param {Object} eventDetails - Event details
   * @param {string} eventDetails.summary - Event title
   * @param {string} eventDetails.description - Event description
   * @param {string} eventDetails.location - Event location (optional)
   * @param {string} eventDetails.startDateTime - Start date and time in ISO format
   * @param {string} eventDetails.endDateTime - End date and time in ISO format
   * @param {string} eventDetails.timeZone - Time zone (default: 'UTC')
   * @param {Array<string>} attendees - List of attendee email addresses
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Object>} Created event
   */
  public async createEvent(eventDetails: CreateCalenderEvent, organizer: EventOrganizer, attendees = [], calendarId = 'primary') {
    try {
      const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        location: eventDetails.location,
        start: { dateTime: eventDetails.startDateTime },
        end: { dateTime: eventDetails.endDateTime },
        attendees: [
          ...attendees.map((email) => ({ email })),
          {
            email: organizer.email,
            responseStatus: EventStatus.ACCEPTED,
            organizer: true,
            self: true,
          },
        ],
        sendUpdates: 'all',
        organizer,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error(`${this.traceId} Failed to create event: ===>`, error);
      return null;
    }
  }

  /**
   * List calendar events
   * @param {Object} options - Query options
   * @param {string} options.timeMin - Start date in ISO format (default: now)
   * @param {string} options.timeMax - End date in ISO format (default: 30 days from now)
   * @param {number} options.maxResults - Maximum number of events to return (default: 100)
   * @param {string} options.q - Search term for events
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Array>} List of events
   */
  public async listEvents(options: ObjectLiteral = {}, calendarId = 'primary') {
    try {
      const timeMin = options.timeMin || new Date().toISOString();
      const timeMax = options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const maxResults = options.maxResults || 100;

      const params = {
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (options.q) params['q'] = options.q;

      const response = await this.calendar.events.list(params);
      return response.data.items || [];
    } catch (error) {
      console.error(`${this.traceId} Failed to list events: ===>`, error);
      return null;
    }
  }

  /**
   * Get a single event by ID
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Object>} Event details
   */
  public async getEvent(eventId, calendarId = 'primary') {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      return response.data;
    } catch (error) {
      console.error(`${this.traceId} Failed to get event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Accept an invitation
   * @param {string} eventId - Event ID
   * @param {string} attendeeEmail - Email of the attendee accepting the invitation
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Object>} Updated event
   */
  public async acceptInvite(eventId: string, attendeeEmail: string, calendarId = 'primary') {
    return this.updateResponseStatus(eventId, EventStatus.ACCEPTED, attendeeEmail, calendarId);
  }

  /**
   * Decline an invitation
   * @param {string} eventId - Event ID
   * @param {string} attendeeEmail - Email of the attendee declining the invitation
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Object>} Updated event
   */
  public async declineInvite(eventId: string, attendeeEmail: string, calendarId = 'primary') {
    return this.updateResponseStatus(eventId, EventStatus.DECLINED, attendeeEmail, calendarId);
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @param {boolean} sendUpdates - Whether to send notifications (default: true)
   * @returns {Promise<void>}
   */
  public async deleteEvent(eventId: string, calendarId = 'primary', sendUpdates = true) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: sendUpdates ? 'all' : 'none',
      });

      return true;
    } catch (error) {
      console.error(`${this.traceId} Failed to delete event ${eventId}: ===>`, error.message);
      throw null;
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} eventId - ID of the event to update
   * @param {Object} eventDetails - Updated event details
   * @param {string} eventDetails.summary - Event title
   * @param {string} eventDetails.description - Event description
   * @param {string} eventDetails.location - Event location
   * @param {string} eventDetails.startDateTime - Start date and time in ISO format
   * @param {string} eventDetails.endDateTime - End date and time in ISO format
   * @param {Array<string>} attendees - List of attendee email addresses (will replace existing attendees)
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @param {boolean} sendUpdates - Whether to send update notifications (default: true)
   * @returns {Promise<Object>} Updated event
   */
  public async updateEvent(eventId: string, eventDetails: Partial<CreateCalenderEvent>, attendees?: string[], calendarId = 'primary', sendUpdates = true) {
    try {
      const currentEvent = await this.getEvent(eventId, calendarId);

      const updatePayload: any = { ...currentEvent };

      if (eventDetails.summary) updatePayload.summary = eventDetails.summary;
      if (eventDetails.description) updatePayload.description = eventDetails.description;
      if (eventDetails.location) updatePayload.location = eventDetails.location;

      if (eventDetails.startDateTime) {
        updatePayload.start = {
          ...updatePayload.start,
          dateTime: eventDetails.startDateTime,
        };
      }

      if (eventDetails.endDateTime) {
        updatePayload.end = {
          ...updatePayload.end,
          dateTime: eventDetails.endDateTime,
        };
      }

      if (attendees) updatePayload.attendees = attendees.map((email) => ({ email }));

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        sendUpdates: sendUpdates ? 'all' : 'none',
        requestBody: updatePayload,
      });

      return response.data;
    } catch (error) {
      console.error(`${this.traceId} Failed to update event ${eventId}: ===>`, error);
      return null;
    }
  }

  private googleClient() {
    try {
      return new google.auth.GoogleAuth({
        keyFile: this.keyfilePath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
    } catch (error) {
      console.error(`${this.traceId} Failed to initialize Google client: ==>`, error.message);
      throw new Error('Google API authentication failed');
    }
  }

  /**
   * Update an event's response status (accept/decline/tentative)
   * @param {string} eventId - Event ID
   * @param {string} responseStatus - Response status ('accepted', 'declined', 'tentative')
   * @param {string} attendeeEmail - Email of the attendee updating their status
   * @param {string} calendarId - Calendar ID (default: 'primary')
   * @returns {Promise<Object>} Updated event
   */
  private async updateResponseStatus(eventId: string, responseStatus: EventStatus, attendeeEmail: string, calendarId = 'primary') {
    try {
      const event = await this.getEvent(eventId, calendarId);

      if (!event.attendees || !event.attendees.length) return true;

      const attendeeIndex = event.attendees.findIndex((a) => a.email === attendeeEmail);

      if (attendeeIndex >= 0) event.attendees[attendeeIndex].responseStatus = responseStatus;

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to update response status for event ${eventId}: ===>`, error.message);
      return null;
    }
  }
}
