import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectMembers, ProjectMemebersModelType } from '@/models';

@injectable()
export class ProjectMembersRepository extends BaseRepository<ProjectMemebersModelType, ProjectMembers> {
  constructor() {
    super(ProjectMembers);
  }
}
