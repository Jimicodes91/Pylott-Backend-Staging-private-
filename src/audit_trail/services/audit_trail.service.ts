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
    } else if (action === AUDIT_TRAIL_ACTION.TASK_ADDED) {
      await this.logTaskAddedActivity(project_id, payload);
    } else if (action === AUDIT_TRAIL_ACTION.NOTE_PINNED) {
      await this.logNotePinnedActivity(project_id, payload);
    }
  }

  async getAuditTrail(company_id: string, project_id: string, filters: AuditTrailFilter = {}, pagination: { page: number; limit: number } = { page: 1, limit: 10 }): Promise<ServiceType> {
    try {
      const { start_date, end_date, action } = filters;

      const formattedFilters = {
        start_date: start_date ? dayjs(start_date).startOf('day').toISOString() : null,
        end_date: end_date ? dayjs(end_date).endOf('day').toISOString() : null,
        action,
      };

      const result = await this.activityLogRepository.getAuditTrail(company_id, project_id, formattedFilters, pagination);

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

  private async save({
    project_id,
    payload,
    db_table,
    activity_description,
    activity_name,
    extras,
  }: {
    project_id: string;
    payload: AuditTrailPayload;
    db_table: string;
    activity_description: string;
    activity_name: AUDIT_TRAIL_ACTION;
    extras?: object;
  }) {
    await this.activityLogRepository.create({
      user_id: payload.user_id,
      company_id: payload.company_id,
      description: activity_description,
      name: activity_name,
      project_id,
      entity: JSON.stringify({
        id: payload.entity_id,
        description: payload.entity_description,
        name: db_table,
        ...extras,
      }),
    });
  }
}
