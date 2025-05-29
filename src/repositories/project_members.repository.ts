import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectMembers, ProjectMemebersModelType } from '@/models';
import { ObjectLiteral } from '@/shared/types/general.type';

@injectable()
export class ProjectMembersRepository extends BaseRepository<ProjectMemebersModelType, ProjectMembers> {
  constructor() {
    super(ProjectMembers);
  }

  async getProjectMembers(project_id: string, company_id: string, query: ObjectLiteral = {}) {
    let qb = this.model.query().where({ project_id, company_id, deleted_at: null });

    if (query.member_type) {
      qb = qb.where('member_type', query.member_type);
    }

    return await qb.withGraphFetched({ user: true, creator: true }).orderBy('created_at');
  }
}
