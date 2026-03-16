import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { TaskClientAssignees, TaskClientAssigneesModelType } from '@/models/task_client_assignees.model';

@injectable()
export class TaskClientAssigneesRepository extends BaseRepository<TaskClientAssigneesModelType, TaskClientAssignees> {
  constructor() {
    super(TaskClientAssignees);
  }
}
