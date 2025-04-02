import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectMembers, ProjectMemebersModelType } from '@/models';

@injectable()
export class ProjectMembersRepository extends BaseRepository<ProjectMemebersModelType, ProjectMembers> {
  constructor() {
    super(ProjectMembers);
  }

  async getProjectMembers(project_id: string, company_id: string) {
    return await this.model.query().where({ project_id, company_id, deleted_at: null }).withGraphFetched({ users: true, creator: true }).orderBy('created_at');
  }
}
