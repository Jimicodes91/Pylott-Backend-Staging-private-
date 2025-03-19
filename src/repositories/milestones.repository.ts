import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { Milestones, MilestonesModelType } from '@/models';

@injectable()
export class MilestonesRepository extends BaseRepository<MilestonesModelType, Milestones> {
  constructor() {
    super(Milestones);
  }
}
