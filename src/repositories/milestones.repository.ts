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
    return await this.model.query().where({ deleted_at: null, project_type_id, company_id }).orderBy('created_at', 'ASC').first();
  }

  async getLastCreatedMilestone(company_id: string, project_type_id: string) {
    return await this.model.query().where({ deleted_at: null, project_type_id, company_id }).orderBy('created_at', 'DESC').first();
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

  async getAllMilestones(company_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({
        company_id,
        project_type_id,
        deleted_at: null,
      })
      .orderBy('created_at', 'asc')
      .withGraphFetched({ projects: true });
  }
}
