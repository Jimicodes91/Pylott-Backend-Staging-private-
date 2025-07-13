import dayjs from 'dayjs';
import { injectable } from 'tsyringe';

import { ActivityLogRepository } from '@/repositories';
import { AUDIT_TRAIL_ACTION } from '@/shared/enums';
import { AuditTrailFilter, AuditTrailPayload } from '@/shared/types/projects.type';
import { ServiceType } from '@/shared/types/general.type';

@injectable()
export class AuditTrailService {
  private traceId = '[Audit Trail Service]';

  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async createEvent(action: AUDIT_TRAIL_ACTION, payload: AuditTrailPayload, project_id: string) {
    if (action === AUDIT_TRAIL_ACTION.NOTE_CREATED) {
      await this.logNoteCreatedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.COMMENT_DELETED) {
      await this.logCommentDeletedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.EVENT_CREATED || action === AUDIT_TRAIL_ACTION.EVENT_UPDATED) {
      await this.logEventsActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.TASK_ADDED) {
      await this.logTaskAddedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.NOTE_PINNED) {
      await this.logNotePinnedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.NOTE_UNPINNED) {
      await this.logNoteUnPinnedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.PROJECT_CREATED || action === AUDIT_TRAIL_ACTION.PROJECT_UPDATED || action === AUDIT_TRAIL_ACTION.PROJECT_DELETED) {
      await this.logProjectActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.PROJECT_MEMBER_ADDED) {
      await this.logProjectMemberActivity(project_id!, payload);
    } else if (
      action === AUDIT_TRAIL_ACTION.USER_LOGIN ||
      action === AUDIT_TRAIL_ACTION.USER_LOGOUT ||
      action === AUDIT_TRAIL_ACTION.USER_SIGNUP ||
      action === AUDIT_TRAIL_ACTION.USER_PASSWORD_RESET ||
      action === AUDIT_TRAIL_ACTION.USER_PASSWORD_UPDATE ||
      action === AUDIT_TRAIL_ACTION.USER_EMAIL_VERIFIED ||
      action === AUDIT_TRAIL_ACTION.USER_INVITATION_SENT ||
      action === AUDIT_TRAIL_ACTION.USER_REGISTRATION_COMPLETED
    ) {
      await this.logAuthActivity(payload);
    } else if (
      action === AUDIT_TRAIL_ACTION.ADMIN_USER_STATUS_UPDATED ||
      action === AUDIT_TRAIL_ACTION.ADMIN_COMPANY_STATUS_UPDATED ||
      action === AUDIT_TRAIL_ACTION.ADMIN_COMPANY_SUBSCRIPTION_UPDATED ||
      action === AUDIT_TRAIL_ACTION.ADMIN_SYS_ADMIN_ADDED ||
      action === AUDIT_TRAIL_ACTION.ADMIN_SYS_ADMIN_DEACTIVATED
    ) {
      await this.logAdminActivity(payload);
    } else if (action === AUDIT_TRAIL_ACTION.CLIENT_CREATED || action === AUDIT_TRAIL_ACTION.CLIENT_UPDATED || action === AUDIT_TRAIL_ACTION.CLIENT_DELETED) {
      await this.logClientActivity(payload);
    } else if (action === AUDIT_TRAIL_ACTION.COMPANY_CREATED || action === AUDIT_TRAIL_ACTION.COMPANY_UPDATED || action === AUDIT_TRAIL_ACTION.COMPANY_SUBSCRIPTION_UPDATED) {
      await this.logCompanyActivity(payload);
    } else if (action === AUDIT_TRAIL_ACTION.ORG_FINANCE_CREATED || action === AUDIT_TRAIL_ACTION.ORG_FINANCE_UPDATED || action === AUDIT_TRAIL_ACTION.ORG_FINANCE_MARKED_PAID) {
      await this.logOrgFinanceActivity(payload);
    } else if (action === AUDIT_TRAIL_ACTION.USER_PROFILE_UPDATED) {
      await this.logUserActivity(payload);
    }
  }

  async getAuditTrail(company_id: string, project_id?: string, filters: AuditTrailFilter = {}, pagination: { page: number; limit: number } = { page: 1, limit: 10 }): Promise<ServiceType> {
    try {
      const { start_date, end_date, action } = filters;

      const formattedFilters = {
        start_date: start_date ? dayjs(start_date).startOf('day').toISOString() : null,
        end_date: end_date ? dayjs(end_date).endOf('day').toISOString() : null,
        action,
      };

      const result = await this.activityLogRepository.getAuditTrail(company_id, formattedFilters, pagination, project_id);

      return { status: true, message: 'Activity logs fetched successfully', data: result };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching milestones ===> ${JSON.stringify({
          company_id,
          project_id,
          filters,
          pagination,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  private async logNoteCreatedActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_notes';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description} left a note`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.NOTE_CREATED,
    });
  }

  private async logCommentDeletedActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_notes';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description} deleted a note`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.COMMENT_DELETED,
    });
  }

  private async logEventsActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'events';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description}`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.COMMENT_DELETED,
    });
  }

  private async logTaskAddedActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_tasks';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description} added a task`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.TASK_ADDED,
    });
  }

  private async logNotePinnedActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_notes';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description} pinned a note`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.NOTE_PINNED,
    });
  }

  private async logNoteUnPinnedActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_notes';
    const ACTIVITY_DESCRIPTION = `${payload.entity_description} pinned a note`;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.NOTE_UNPINNED,
    });
  }

  private async logProjectActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'projects';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.NOTE_UNPINNED,
    });
  }

  private async logProjectMemberActivity(project_id: string, payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'project_members';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.NOTE_UNPINNED,
    });
  }

  private async logAuthActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'users';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.USER_LOGIN,
    });
  }

  private async logAdminActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'admin_actions';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.ADMIN_USER_STATUS_UPDATED,
    });
  }

  private async logClientActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'clients';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.CLIENT_CREATED,
    });
  }

  private async logCompanyActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'companies';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.COMPANY_CREATED,
    });
  }

  private async logOrgFinanceActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'org_finance';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.ORG_FINANCE_CREATED,
    });
  }

  private async logUserActivity(payload: AuditTrailPayload) {
    const ASSOCIATED_ENTITY_TABLE = 'users';
    const ACTIVITY_DESCRIPTION = payload.entity_description;

    await this.save({
      project_id: null,
      payload,
      db_table: ASSOCIATED_ENTITY_TABLE,
      activity_description: ACTIVITY_DESCRIPTION,
      activity_name: AUDIT_TRAIL_ACTION.USER_PROFILE_UPDATED,
    });
  }

  private async save({
    project_id,
    payload,
    db_table,
    activity_description,
    activity_name,
    extras,
  }: {
    project_id: string | null;
    payload: AuditTrailPayload;
    db_table: string;
    activity_description: string;
    activity_name: AUDIT_TRAIL_ACTION;
    extras?: object;
  }) {
    await this.activityLogRepository.create({
      user_id: payload.user_id,
      company_id: payload.company_id || '', // Use empty string if company_id is null
      description: activity_description,
      name: activity_name,
      project_id: project_id,
      entity: JSON.stringify({
        id: payload.entity_id,
        description: payload.entity_description,
        name: db_table,
        ...extras,
      }),
    });
  }
}
