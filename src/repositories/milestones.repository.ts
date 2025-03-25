import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { Milestones, MilestonesModelType } from '@/models';

@injectable()
export class MilestonesRepository extends BaseRepository<MilestonesModelType, Milestones> {
  constructor() {
    super(Milestones);
  }

  async findMilestoneWhereNotName(company_id: string, project_type_id: string, name: string, id: string) {
    return await this.model.query().where('company_id', company_id).where('project_type_id', project_type_id).where('name', name).whereNot('id', id).first();
  }

  async getMilestone(company_id: string, milestone_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({
        company_id,
        id: milestone_id,
        project_type_id,
      })
      .withGraphFetched('stages')
      .first();
  }

  async getAllMilestones(company_id: string, project_type_id: string) {
    return await this.model
      .query()
      .where({
        company_id,
        project_type_id,
      })
      .withGraphFetched('stages');
  }
}
