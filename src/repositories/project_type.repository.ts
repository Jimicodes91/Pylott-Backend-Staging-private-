import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectType, ProjectTypeModelType } from '@/models';

@injectable()
export class ProjectTypeRepository extends BaseRepository<ProjectTypeModelType, ProjectType> {
  constructor() {
    super(ProjectType);
  }

  async findOneWhereNameEquals(name: string, company_id: string, id: string) {
    return await this.model.query().where({ name, company_id, deleted_at: null }).where('id', '<>', id).first();
  }
}
