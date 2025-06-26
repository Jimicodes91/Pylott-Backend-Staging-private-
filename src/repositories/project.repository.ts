import { injectable } from 'tsyringe';

import { Project, ProjectModelType } from '@/models';
import BaseRepository from './base.repository';
import { ObjectLiteral } from '@/shared/types/general.type';
import { ClientAnalytics, ProjectAnalyticsResult } from '@/shared/interface/model';

@injectable()
export class ProjectRepository extends BaseRepository<ProjectModelType, Project> {
  constructor() {
    super(Project);
  }

  async getProjectsAndAssociatedEntities(query: ObjectLiteral, search?: string) {
    const { client_user_id = null, ...otherQueries } = query;

    const qb = this.model.query().where(otherQueries);

    if (search && search.length) {
      qb.andWhere('name', 'like', `%${search}%`);
    }

    if (client_user_id) {
      qb.andWhereRaw(
        `JSON_CONTAINS(form_data->'$.project_client', JSON_ARRAY((
        SELECT id FROM contacts WHERE user_id = ? AND company_id = ? AND deleted_at IS NULL
      )))`,
        [client_user_id],
      );
    }

    return await qb
      .withGraphFetched({
        documents: { attachments: true },
        milestone: true,
        project_type: true,
        client: true,
      })
      .modifyGraph('milestone', (qb) => qb.orderBy('created_at', 'asc'))
      .orderBy('created_at', 'desc');
  }

  async searchProjectsByName(company_id: string, searchTerm: string, limit: number = 10) {
    return await this.model
      .query()
      .where({ company_id, deleted_at: null })
      .andWhere('name', 'like', `%${searchTerm}%`)
      .limit(limit)
      .withGraphFetched({ documents: { attachments: true }, milestone: true, project_type: true, client: true })
      .modifyGraph('milestone', (qb) => qb.orderBy('created_at', 'asc'))
      .orderBy('created_at', 'desc');
  }

  async getProjectDetails(company_id: string, project_id: string) {
    return this.model
      .query()
      .where({ id: project_id, company_id, deleted_at: null })
      .withGraphFetched({ documents: { attachments: true }, milestone: true, project_type: true, client: true })
      .modifyGraph('milestone', (qb) => qb.orderBy('created_at', 'asc'))
      .first();
  }

  async getProjectAndMembers(project_id: string) {
    return this.model
      .query()
      .where({ id: project_id, deleted_at: null })
      .withGraphFetched({ members: { user: true } })
      .modifyGraph('milestone', (qb) => qb.orderBy('created_at', 'asc'))
      .first();
  }

  async getCombinedProjectAnalytics(companyId: string): Promise<ProjectAnalyticsResult> {
    const result = await this.model
      .query()
      .where('company_id', companyId)
      .whereNull('deleted_at')
      .select([
        this.model.raw('COUNT(id) as total'),
        this.model.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
        this.model.raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
        this.model.raw(`
        SUM(CASE WHEN 
          DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') 
          THEN 1 ELSE 0 END
        ) as current_month_count`),
        this.model.raw(`
        SUM(CASE WHEN 
          DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m') 
          THEN 1 ELSE 0 END
        ) as last_month_count`),
      ])
      .first()
      .castTo<ProjectAnalyticsResult>();

    return {
      total: Number(result?.total) || 0,
      completed: Number(result?.completed) || 0,
      in_progress: Number(result?.in_progress) || 0,
      current_month_count: Number(result?.current_month_count) || 0,
      last_month_count: Number(result?.last_month_count) || 0,
    };
  }

  async getRecentProject(company_id: string, size = 5) {
    return await this.model
      .query()
      .where({ deleted_at: null, company_id })
      .limit(size)
      .select('id', 'name', 'status', 'form_data', 'start_date', 'project_type_id', 'milestone_id')
      .withGraphFetched({ milestone: true, project_type: { milestones: true } });
  }

  async getTopClients(companyId: string, limit: number = 5): Promise<ClientAnalytics[]> {
    const query = `
        SELECT 
          c.id AS client_id,
          c.name AS client_name,
          comp.name AS company_name,
          COUNT(p.id) AS project_count,
          SUM(CASE WHEN p.status != 'completed' THEN 1 ELSE 0 END) AS active_project_count
        FROM contacts c
        JOIN companies comp ON c.company_id = comp.id
        JOIN (
          SELECT 
            p.id,
            p.status,
            p.company_id,
            JSON_UNQUOTE(JSON_EXTRACT(p.form_data, CONCAT('$.project_client[', seq.seq, ']'))) AS client_id
          FROM 
            projects p
            JOIN (
              SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL 
              SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            ) seq ON seq.seq < JSON_LENGTH(COALESCE(p.form_data->'$.project_client', JSON_ARRAY()))
          WHERE 
            p.deleted_at IS NULL
            AND JSON_CONTAINS_PATH(p.form_data, 'one', '$.project_client')
        ) p ON p.client_id = c.id AND p.company_id = c.company_id
        WHERE c.company_id = ?
        GROUP BY c.id, c.name, comp.name
        ORDER BY project_count DESC
        LIMIT ?
      `;

    const results = await this.model.knex().raw(query, [companyId, limit]);

    return results[0].map((row: any) => ({
      client_id: row.client_id,
      client_name: row.client_name,
      company_name: row.company_name || '',
      project_count: Number(row.project_count),
      active_project_count: Number(row.active_project_count),
    }));
  }
}
