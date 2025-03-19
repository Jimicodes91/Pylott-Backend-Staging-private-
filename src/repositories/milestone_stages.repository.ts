import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { MileStoneStages, MileStoneStagesModelType } from '@/models';

@injectable()
export class MilestoneStagesRepository extends BaseRepository<MileStoneStagesModelType, MileStoneStages> {
  constructor() {
    super(MileStoneStages);
  }
}
