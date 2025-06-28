import { injectable } from 'tsyringe';

import { Metadata, MetadataModelType } from '@/models';
import BaseRepository from './base.repository';
import { MetadataType } from '@/shared/enums';

@injectable()
export class MetadataRepository extends BaseRepository<MetadataModelType, Metadata> {
  constructor() {
    super(Metadata);
  }

  public async findByType(company_id: string, type: MetadataType) {
    return this.model.query().where({ company_id, type }).orderBy('created_at', 'DESC');
  }

  public async findRecentlyCreateByType(company_id: string, type: MetadataType, limit: number) {
    return this.model.query().where({ company_id, type }).limit(limit).orderBy('created_at', 'DESC');
  }
}
