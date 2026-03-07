import { injectable } from 'tsyringe';

import { Consultant, ConsultantModelType } from '@/models/consultant.model';
import BaseRepository from './base.repository';

@injectable()
export class ConsultantRepository extends BaseRepository<ConsultantModelType, Consultant> {
  constructor() {
    super(Consultant);
  }
}
