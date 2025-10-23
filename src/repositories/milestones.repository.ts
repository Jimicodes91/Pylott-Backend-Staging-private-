import { injectable } from 'tsyringe';

import { Milestones, MilestonesModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class MilestonesRepository extends BaseRepository<MilestonesModelType, Milestones> {
  constructor() {
    super(Milestones);
  }

  async findMilestoneWhereNotName(company_id: string, project_type_id: string, name: string, id: string) {
    return await this.model.query().where('company_id', company_id).where('project_type_id', project_type_id).where('name', name).whereNull('deleted_at').whereNot('id', id).first();
  }

  async getFirstCreatedMilestone(company_id: string, project_type_id: string) {
    return await this.model.query().where({ deleted_at: null, project_type_id, company_id }).orderBy('order', 'asc').orderBy('created_at', 'ASC').first();
  }

  async getLastCreatedMilestone(company_id: string, project_type_id: string) {
    return await this.model.query().where({ deleted_at: null, project_type_id, company_id }).orderBy('order', 'desc').orderBy('created_at', 'DESC').first();
  }

  async getMilestone(company_id: string, milestone_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({
        company_id,
        id: milestone_id,
        project_type_id,
        deleted_at: null,
      })
      .withGraphFetched({ projects: true })
      .first();
  }

  async findMaxOrder(project_type_id: string, company_id: string): Promise<number> {
    const result = await this.model.query().where({ project_type_id, company_id, deleted_at: null }).max('order').first();

    if (result && typeof result.order === 'number') {
      return result.order;
    }

    return -1;
  }

  async getAllMilestones(company_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({
        company_id,
        project_type_id,
        deleted_at: null,
      })
      .orderBy('order', 'asc')
      .orderBy('created_at', 'asc')
      .withGraphFetched({ projects: true });
  }
}
