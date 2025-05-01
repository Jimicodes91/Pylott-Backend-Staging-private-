import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ActivityLogs, ActivityLogsModelType } from '@/models';
import { AuditTrailFilter } from '@/shared/types/projects.type';

@injectable()
export class ActivityLogRepository extends BaseRepository<ActivityLogsModelType, ActivityLogs> {
  constructor() {
    super(ActivityLogs);
  }

  async getAuditTrail(company_id: string, project_id: string, filters: AuditTrailFilter, pagination: { page: number; limit: number }) {
    const { start_date, end_date, action } = filters;
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const query = this.model.query().where('company_id', company_id);

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
}
