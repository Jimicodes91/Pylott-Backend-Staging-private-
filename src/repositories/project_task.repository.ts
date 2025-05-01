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
      .withGraphFetched({ document: { attachments: true }, task_type: true, pipeline: true, assignees: { user: true }, company: true })
      .first();
  }

  async getTaskById(company_id: string, project_id: string, task_id: string) {
    return await this.model.query().where({ company_id, project_id, id: task_id, deleted_at: null }).withGraphFetched({ assignees: true }).first();
  }

  async getAllTasks(company_id: string, project_id: string = null) {
    let qb = this.model.query().where({ company_id, deleted_at: null });

    if (project_id) qb = qb.where({ project_id });

    return await qb.withGraphFetched({ document: { attachments: true }, task_type: true, pipeline: true, assignees: { user: true }, company: true });
  }

  async getTaskWhereName(project_id: string, name: string, task_id: string) {
    return await this.model.query().where({ project_id, name, deleted_at: null }).where('id', '<>', task_id).first();
  }
}
