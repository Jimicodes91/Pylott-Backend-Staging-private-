// import { injectable } from 'tsyringe';
// import axios, { AxiosInstance } from 'axios';

// import { EventStatus } from '@/shared/enums';
// import { calender } from '@config/env';
// import { ObjectLiteral } from '@/shared/types/general.type';
// import { CreateCalenderEvent, EventOrganizer } from '@/shared/types/events.type';

// @injectable()
// export class CalComService {
//   private traceId = '[Cal.com]';
//   private readonly client: AxiosInstance;

//   constructor() {
//     this.client = axios.create({
//       baseURL: calender.base_url,
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${calender.api_key}`,
//       },
//     });
//   }

//   /**
//    * Create a calendar event
//    */
//   public async createEvent(eventDetails: CreateCalenderEvent, organizer: EventOrganizer, attendees: string[] = []) {
//     try {
//       const response = await this.client.post('/bookings', {
//         eventTypeId: eventDetails.eventTypeId,
//         start: eventDetails.startDateTime,
//         end: eventDetails.endDateTime,
//         title: eventDetails.summary,
//         description: eventDetails.description,
//         location: eventDetails.location,
//         organizerEmail: organizer.email,
//         attendees: attendees.map((email) => ({ email })),
//         metadata: {},
//         timeZone: 'UTC',
//       });

//       return response.data;
//     } catch (error) {
//       this.handleError(error, 'Failed to create event');
//       return null;
//     }
//   }

//   /**
//    * List calendar events
//    */
//   public async listEvents(options: ObjectLiteral = {}) {
//     try {
//       const params = {
//         startTime: options.timeMin || new Date().toISOString(),
//         endTime: options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
//         limit: options.limit || 100,
//         ...(options.userId && { userId: options.userId }),
//         ...(options.eventTypeId && { eventTypeId: options.eventTypeId }),
//       };

//       const response = await this.client.get('/bookings', { params });
//       return response.data.bookings || [];
//     } catch (error) {
//       this.handleError(error, 'Failed to list events');
//       return null;
//     }
//   }

//   /**
//    * Get a single event by ID
//    */
//   public async getEvent(eventId: string) {
//     try {
//       const response = await this.client.get(`/bookings/${eventId}`);
//       return response.data;
//     } catch (error) {
//       this.handleError(error, `Failed to get event ${eventId}`);
//       return null;
//     }
//   }

//   /**
//    * Accept an invitation
//    */
//   public async acceptInvite(eventId: string, attendeeEmail: string) {
//     return this.updateResponseStatus(eventId, EventStatus.ACCEPTED, attendeeEmail);
//   }

//   /**
//    * Decline an invitation
//    */
//   public async declineInvite(eventId: string, attendeeEmail: string) {
//     return this.updateResponseStatus(eventId, EventStatus.DECLINED, attendeeEmail);
//   }

//   /**
//    * Delete an event
//    */
//   public async deleteEvent(eventId: string, sendUpdates = true) {
//     try {
//       await this.client.delete(`/bookings/${eventId}`, {
//         data: { sendNotifications: sendUpdates },
//       });
//       return true;
//     } catch (error) {
//       this.handleError(error, `Failed to delete event ${eventId}`);
//       return false;
//     }
//   }

//   /**
//    * Update an existing calendar event
//    */
//   public async updateEvent(eventId: string, eventDetails: Partial<CreateCalenderEvent>, attendees?: string[], sendUpdates = true) {
//     try {
//       const payload: Record<string, any> = {
//         sendNotifications: sendUpdates,
//       };

//       if (eventDetails.summary) payload.title = eventDetails.summary;
//       if (eventDetails.description) payload.description = eventDetails.description;
//       if (eventDetails.location) payload.location = eventDetails.location;
//       if (eventDetails.startDateTime) payload.start = eventDetails.startDateTime;
//       if (eventDetails.endDateTime) payload.end = eventDetails.endDateTime;
//       if (attendees) payload.attendees = attendees.map((email) => ({ email }));

//       const response = await this.client.patch(`/bookings/${eventId}`, payload);
//       return response.data;
//     } catch (error) {
//       this.handleError(error, `Failed to update event ${eventId}`);
//       return null;
//     }
//   }

//   /**
//    * Respond to an event
//    */
//   public async respondToEvent(eventId: string, userEmail: string, responseStatus: 'accepted' | 'declined' | 'tentative'): Promise<boolean> {
//     try {
//       if (responseStatus === 'accepted') {
//         await this.client.post(`/bookings/${eventId}/confirm`);
//       } else if (responseStatus === 'declined') {
//         await this.client.post(`/bookings/${eventId}/cancel`, {
//           reason: `Declined by ${userEmail}`,
//         });
//       }
//       return true;
//     } catch (error) {
//       this.handleError(error, `Error responding to event for user ${userEmail}`);
//       return false;
//     }
//   }

//   /**
//    * Update response status
//    */
//   private async updateResponseStatus(eventId: string, responseStatus: EventStatus, attendeeEmail: string) {
//     try {
//       if (responseStatus === EventStatus.ACCEPTED) {
//         const response = await this.client.post(`/bookings/${eventId}/confirm`);
//         return response.data;
//       } else if (responseStatus === EventStatus.DECLINED) {
//         const response = await this.client.post(`/bookings/${eventId}/cancel`, {
//           reason: `Declined by ${attendeeEmail}`,
//         });
//         return response.data;
//       }
//       return null;
//     } catch (error) {
//       this.handleError(error, `Failed to update status for event ${eventId}`);
//       return null;
//     }
//   }

//   /**
//    * Handle API errors consistently
//    */
//   private handleError(error: any, context: string) {
//     if (error.response) {
//       console.error(`${this.traceId} ${context}:`, {
//         status: error.response.status,
//         data: error.response.data,
//       });
//     } else {
//       console.error(`${this.traceId} ${context}:`, error.message);
//     }
//   }
// }
