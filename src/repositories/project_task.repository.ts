import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTask, ProjectTaskModelType } from '@/models';

@injectable()
export class ProjectTaskRepository extends BaseRepository<ProjectTaskModelType, ProjectTask> {
  constructor() {
    super(ProjectTask);
  }
}
