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

  async getAllProjectTypes(company_id: string) {
    return await this.model.query().where({ company_id, deleted_at: null }).orderBy('created_at', 'desc').withGraphFetched({ milestones: true });
  }

  async getProjectType(company_id: string, project_type_id: string) {
    return await this.model.query().where({ company_id, id: project_type_id, deleted_at: null }).withGraphFetched({ milestones: true }).first();
  }
}
