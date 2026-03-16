import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { TaskClientResponses, TaskClientResponsesModelType } from '@/models/task_client_responses.model';

@injectable()
export class TaskClientResponsesRepository extends BaseRepository<TaskClientResponsesModelType, TaskClientResponses> {
  constructor() {
    super(TaskClientResponses);
  }
}
