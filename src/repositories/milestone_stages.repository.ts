import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { MileStoneStages, MileStoneStagesModelType } from '@/models';

@injectable()
export class MilestoneStagesRepository extends BaseRepository<MileStoneStagesModelType, MileStoneStages> {
  constructor() {
    super(MileStoneStages);
  }

  async findMilestoneStageWhereNotName(company_id: string, milestone_id: string, name: string, id: string) {
    return await this.model.query().where('company_id', company_id).where('milestone_id', milestone_id).where('name', name).whereNot('id', id).first();
  }
}
