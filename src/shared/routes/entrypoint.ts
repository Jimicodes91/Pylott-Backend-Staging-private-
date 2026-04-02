import { Request, Response } from 'express';

import { Server } from '@shared/types/http.type';
import { successResponse } from '@shared/utils/api-response';
import { RoutePrefix } from '../enums';

// Static imports — these don't cause circular dependency issues
import { authRoutes } from '@/modules/auth/auth.route';
import { notificationRoutes } from '@/modules/notifications/notification.routes';
import { userRoutes } from '@/modules/user/user.route';
import { companyRoutes } from '@/modules/company/company.route';
import { sysAdminRoutes } from '@/modules/admin/admin.route';
import { auditTrailRoutes } from '@/modules/audit_trail/audit_trail.route';
import { projectSettingRoutes } from '@/modules/project_settings/project_settings.route';
import { metadataRoutes } from '@/modules/metadata/metadata.route';
import { billingRoutes } from '@/modules/billing/billing.route';
import { clientRoutes } from '@/modules/clients/client.route';
import { contactRoutes } from '@/modules/contact/contact.route';
import { orgFinanceRoutes } from '@/modules/organization-finance/org-finance.route';
import { subscriptionRoutes } from '@/modules/subscription/subscription.route';

export default (server: Server) => {
  server.get('/', (_: Request, response: Response) => successResponse(response, 'Welcome to Pylott 🚀'));

  // Auth & notifications
  authRoutes(`${RoutePrefix.V1}/auth`, server);
  notificationRoutes(`${RoutePrefix.V1}`, server);

  // User, company, admin
  userRoutes(`${RoutePrefix.V1}/user`, server);
  companyRoutes(`${RoutePrefix.V1}/company`, server);
  sysAdminRoutes(`${RoutePrefix.V1}/admin`, server);

  // Audit trail (registered on both prefixes to match original)
  auditTrailRoutes(`${RoutePrefix.V1}/audit-trails`, server);
  auditTrailRoutes(`${RoutePrefix.V1}/audit-trail`, server);

  // Settings, metadata, billing
  projectSettingRoutes(`${RoutePrefix.V1}/settings`, server);
  metadataRoutes(`${RoutePrefix.V1}/metadata`, server);
  billingRoutes(`${RoutePrefix.V1}/billing`, server);

  // Clients, contacts, org-finance, subscription
  clientRoutes(`${RoutePrefix.V1}/client`, server);
  contactRoutes(`${RoutePrefix.V1}/contacts`, server);
  orgFinanceRoutes(`${RoutePrefix.V1}/org-finance`, server);
  subscriptionRoutes(`${RoutePrefix.V1}/subscription`, server);

  // Dynamic imports — these modules have circular dependency issues with tsyringe/Objection.js
  try {
    const { docsRoutes } = require('@/modules/docs/docs.route');
    docsRoutes(`${RoutePrefix.V1}/projects`, server);
  } catch (error) {
    console.error('Failed to load docs routes:', error.message);
  }

  try {
    const { eventRoutes } = require('@/modules/events/event.route');
    eventRoutes(`${RoutePrefix.V1}/projects`, server);
  } catch (error) {
    console.error('Failed to load event routes:', error.message);
  }

  try {
    const { projectCoreRoutes } = require('@/modules/projects/project.route');
    projectCoreRoutes(`${RoutePrefix.V1}/projects`, server);
  } catch (error) {
    console.error('Failed to load project core routes:', error.message);
  }

  try {
    const { standaloneTaskRoutes } = require('@/modules/projects/task.route');
    standaloneTaskRoutes(`${RoutePrefix.V1}/tasks`, server);
  } catch (error) {
    console.error('Failed to load standalone task routes:', error.message);
  }

  try {
    const { projectFormRoutes } = require('@/modules/projects/project-form.route');
    projectFormRoutes(`${RoutePrefix.V1}/projects`, server);
  } catch (error) {
    console.error('Failed to load project form routes:', error.message);
  }

  try {
    const { formsRoutes } = require('@/modules/forms/forms.route');
    formsRoutes(`${RoutePrefix.V1}/forms`, server);
  } catch (error) {
    console.error('Failed to load forms routes:', error.message);
  }
};
