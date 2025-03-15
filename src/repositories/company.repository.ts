import { injectable } from 'tsyringe';

import { Company, CompanyModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class CompanyRepository extends BaseRepository<CompanyModelType, Company> {
  constructor() {
    super(Company);
  }
}
