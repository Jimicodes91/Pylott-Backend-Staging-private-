import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ActivityLogs, ActivityLogsModelType } from '@/models/activity_log.model';
import { AuditTrailFilter } from '@/shared/types/projects.type';

@injectable()
export class ActivityLogRepository extends BaseRepository<ActivityLogsModelType, ActivityLogs> {
  constructor() {
    super(ActivityLogs);
  }

  async getAuditTrail(company_id: string, filters: AuditTrailFilter, pagination: { page: number; limit: number }, project_id?: string) {
    const { start_date, end_date, action } = filters;
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const query = this.model.query();

    if (company_id) {
      query.where('company_id', company_id);
    }

    if (project_id) query.where('project_id', project_id);

    if (start_date && end_date) {
      query.whereBetween('created_at', [start_date, end_date]);
    }

    if (action) {
      query.where('name', action);
    }

    const logs = await query.orderBy('created_at', 'desc').offset(offset).limit(limit).withGraphFetched({ author: true });
    const totalCount = await query.clone().clearOrder().resultSize();

    return {
      trails: logs.map((trail) => {
        const { entity, ...others } = trail;
        return { ...others, entity: JSON.parse(entity) };
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getAdminActivities(filters: AuditTrailFilter, pagination: { page: number; limit: number }) {
    const { start_date, end_date, action } = filters;
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get all admin-related actions
    const adminActions = [
      'ADMIN_USER_STATUS_UPDATED',
      'ADMIN_COMPANY_STATUS_UPDATED',
      'ADMIN_COMPANY_SUBSCRIPTION_UPDATED',
      'ADMIN_SYS_ADMIN_ADDED',
      'ADMIN_SYS_ADMIN_DEACTIVATED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_SIGNUP',
      'USER_PASSWORD_RESET',
      'USER_PASSWORD_UPDATE',
      'USER_EMAIL_VERIFIED',
      'USER_INVITATION_SENT',
      'USER_REGISTRATION_COMPLETED',
      'CLIENT_CREATED',
      'CLIENT_UPDATED',
      'CLIENT_DELETED',
      'COMPANY_CREATED',
      'COMPANY_UPDATED',
      'COMPANY_SUBSCRIPTION_UPDATED',
      'ORG_FINANCE_CREATED',
      'ORG_FINANCE_UPDATED',
      'ORG_FINANCE_MARKED_PAID',
      'USER_PROFILE_UPDATED',
      'USER_ADDED_TO_COMPANY',
      'USER_REMOVED_FROM_COMPANY',
    ];

    const query = this.model.query().whereIn('name', adminActions);

    if (start_date && end_date) {
      query.whereBetween('created_at', [start_date, end_date]);
    }

    if (action) {
      query.where('name', action);
    }

    const logs = await query.orderBy('created_at', 'desc').offset(offset).limit(limit).withGraphFetched({ author: true });
    const totalCount = await query.clone().clearOrder().resultSize();

    return {
      trails: logs.map((trail) => {
        const { entity, ...others } = trail;
        return { ...others, entity: JSON.parse(entity) };
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
