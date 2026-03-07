import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { authRoutes } from '@/modules/auth/auth.route';
import { notificationRoutes } from '@/modules/notifications/notification.routes';
import { RoutePrefix } from '../enums';

// Debug logging for circular dependency investigation
console.log('[ENTRYPOINT] Starting route registration...');

export default (server: Server) => {
  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  console.log('[ENTRYPOINT] Registering auth routes...');
  authRoutes(`${RoutePrefix.V1}/auth`, server);
  console.log('[ENTRYPOINT] Auth routes registered successfully');

  console.log('[ENTRYPOINT] Registering notification routes...');
  notificationRoutes(`${RoutePrefix.V1}`, server);
  console.log('[ENTRYPOINT] Notification routes registered successfully');

  // Test docs routes first
  console.log('[ENTRYPOINT] Registering docs routes...');
  try {
    const { docsRoutes } = require('@/modules/docs/docs.route');
    docsRoutes(`${RoutePrefix.V1}/projects`, server);
    console.log('[ENTRYPOINT] Docs routes registered successfully');
  } catch (error) {
    console.error('[ENTRYPOINT] Failed to load docs routes:', error.message);
  }

  // Test event routes
  console.log('[ENTRYPOINT] Registering event routes...');
  try {
    const { eventRoutes } = require('@/modules/events/event.route');
    eventRoutes(`${RoutePrefix.V1}/projects`, server);
    console.log('[ENTRYPOINT] Event routes registered successfully');
  } catch (error) {
    console.error('[ENTRYPOINT] Failed to load event routes:', error.message);
  }

  // Test project core routes
  console.log('[ENTRYPOINT] Registering project core routes...');
  try {
    const { projectCoreRoutes } = require('@/modules/projects/project.route');
    projectCoreRoutes(`${RoutePrefix.V1}/projects`, server);
    console.log('[ENTRYPOINT] Project core routes registered successfully');
  } catch (error) {
    console.error('[ENTRYPOINT] Failed to load project core routes:', error.message);
  }

  // Test project form routes
  console.log('[ENTRYPOINT] Registering project form routes...');
  try {
    const { projectFormRoutes } = require('@/modules/projects/project-form.route');
    projectFormRoutes(`${RoutePrefix.V1}/projects`, server);
    console.log('[ENTRYPOINT] Project form routes registered successfully');
  } catch (error) {
    console.error('[ENTRYPOINT] Failed to load project form routes:', error.message);
  }

  console.log('[ENTRYPOINT] Route registration complete');
};
