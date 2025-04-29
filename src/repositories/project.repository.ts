import { injectable } from 'tsyringe';

import { Project, ProjectModelType } from '@/models';
import BaseRepository from './base.repository';
import { ObjectLiteral } from '@/shared/types/general.type';

@injectable()
export class ProjectRepository extends BaseRepository<ProjectModelType, Project> {
  constructor() {
    super(Project);
  }

  async getProjectsAndAssociatedEntities(query: ObjectLiteral) {
    return await this.model
      .query()
      .where(query)
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
}
