import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectType, ProjectTypeModelType } from '@/models';
import { PipelineAnalytics } from '@/shared/interface/model';

@injectable()
export class ProjectTypeRepository extends BaseRepository<ProjectTypeModelType, ProjectType> {
  constructor() {
    super(ProjectType);
  }

  async findOneWhereNameEquals(name: string, company_id: string, id: string) {
    return await this.model.query().where({ name, company_id, deleted_at: null }).where('id', '<>', id).first();
  }

  async getAllProjectTypes(company_id: string) {
    return await this.model
      .query()
      .where({ company_id, deleted_at: null })
      .orderBy('created_at', 'desc')
      .withGraphFetched({ milestones: true })
      .modifyGraph('milestones', (builder) => {
        builder.orderBy('order', 'asc');
      });
  }

  async getProjectType(company_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({ company_id, id: project_type_id, deleted_at: null })
      .withGraphFetched({ milestones: true })
      .modifyGraph('milestones', (builder) => {
        builder.orderBy('order', 'asc');
      })
      .first();
  }
  async getPipelineAnalyticsSingleQuery(companyId: string): Promise<PipelineAnalytics[]> {
    const result = await this.model.knex().raw(
      `
          SELECT
            pt.id,
            pt.name,
            COUNT(p.id) as project_count,
            SUM(CASE WHEN p.status != 'completed' THEN 1 ELSE 0 END) as active_project_count,
            COALESCE(SUM(m.duration), 0) as completion_days
          FROM project_types pt
          LEFT JOIN projects p ON p.project_type_id = pt.id AND p.company_id = ? AND p.deleted_at IS NULL
          LEFT JOIN milestones m ON m.project_type_id = pt.id AND m.company_id = ? AND m.deleted_at IS NULL
          WHERE pt.company_id = ? AND pt.deleted_at IS NULL
          GROUP BY pt.id, pt.name
          ORDER BY pt.name
          LIMIT 5
        `,
      [companyId, companyId, companyId],
    );

    return result[0].map((row) => ({
      id: row.id,
      name: row.name,
      project_count: Number(row.project_count),
      active_project_count: Number(row.active_project_count),
      completion_days: Number(row.completion_days),
    }));
  }

  async countActiveProjects(project_type_id: string): Promise<number> {
    return await this.model.relatedQuery('projects').for(project_type_id).where('deleted_at', null).resultSize();
  }
}
