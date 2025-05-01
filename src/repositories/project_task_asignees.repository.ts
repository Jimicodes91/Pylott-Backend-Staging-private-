import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTaskAssignees, ProjectTaskAssigneesModelType } from '@/models/project_task_asignees.model';

@injectable()
export class ProjectTaskAssigneesRepository extends BaseRepository<ProjectTaskAssigneesModelType, ProjectTaskAssignees> {
  constructor() {
    super(ProjectTaskAssignees);
  }
}
