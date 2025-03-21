import { injectable } from 'tsyringe';

import { Project, ProjectModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class ProjectRepository extends BaseRepository<ProjectModelType, Project> {
  constructor() {
    super(Project);
  }
}
