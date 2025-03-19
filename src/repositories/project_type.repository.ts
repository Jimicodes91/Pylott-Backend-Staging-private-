import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectType, ProjectTypeModelType } from '@/models';

@injectable()
export class ProjectTypeRepository extends BaseRepository<ProjectTypeModelType, ProjectType> {
  constructor() {
    super(ProjectType);
  }
}
