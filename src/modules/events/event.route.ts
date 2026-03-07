import { container } from 'tsyringe';

import { authenticateUser as authGuard } from '@/shared/middlewares/guard.middleware';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { Server } from '@/shared/types/http.type';
import { createEventValidationRules, updateEventValidationRules } from '@/shared/validations/event';

// Lazy controller resolution with dynamic imports
const getEventsController = async () => {
  const { EventController } = await import('./event.controller');
  return container.resolve(EventController);
};

export const eventRoutes = (prefix: string, server: Server) => {
  /**
   * Events
   */
  server.post(`${prefix}/:project_id/events`, authGuard, schemaValidator(createEventValidationRules), async (req, res) => (await getEventsController()).createEvent(req, res));
  server.get(`${prefix}/:project_id/events`, authGuard, async (req, res) => (await getEventsController()).getAllEvents(req, res));
  server.patch(`${prefix}/:project_id/events/:event_id`, authGuard, schemaValidator(updateEventValidationRules), async (req, res) => (await getEventsController()).updateEvent(req, res));
  server.get(`${prefix}/:project_id/events/:event_id`, authGuard, async (req, res) => (await getEventsController()).getEventDetails(req, res));
  server.delete(`${prefix}/:project_id/events/:event_id`, authGuard, async (req, res) => (await getEventsController()).deleteEvent(req, res));
  // New event invitation response endpoints
  server.post(`${prefix}/:project_id/events/:event_id/accept`, authGuard, async (req, res) => (await getEventsController()).acceptEventInvite(req, res));
  server.post(`${prefix}/:project_id/events/:event_id/decline`, authGuard, async (req, res) => (await getEventsController()).declineEventInvite(req, res));
};
