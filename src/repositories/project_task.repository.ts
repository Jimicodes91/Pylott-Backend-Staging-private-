import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTask, ProjectTaskModelType } from '@/models';

@injectable()
export class ProjectTaskRepository extends BaseRepository<ProjectTaskModelType, ProjectTask> {
  constructor() {
    super(ProjectTask);
  }

  async getTaskDetails(company_id: string, project_id: string, task_id: string) {
    return await this.model
      .query()
      .where({ company_id, project_id, id: task_id, deleted_at: null })
      .withGraphFetched({ document: { attachments: true }, assignee: true })
      .first();
  }

  async getAllTasks(company_id: string, project_id: string) {
    return await this.model
      .query()
      .where({ company_id, project_id, deleted_at: null })
      .withGraphFetched({ document: { attachments: true }, assignee: true });
  }

  async getTaskWhereName(project_id: string, name: string, task_id: string) {
    return await this.model.query().where({ project_id, name, deleted_at: null }).where('id', '<>', task_id).first();
  }
}
