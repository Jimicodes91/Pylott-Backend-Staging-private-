import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTask, ProjectTaskModelType } from '@/models';
import { TaskStatusCounts } from '@/shared/interface/model';
import { ProjectTaskStatus } from '@/shared/enums';
import { ObjectLiteral } from '@/shared/types/general.type';

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

  async getAllTasks(company_id: string, project_id: string = null, query: ObjectLiteral = {}) {
    let qb = this.model.query().where({ company_id, deleted_at: null });

    if (project_id) qb = qb.where({ project_id });

    if (query.search) qb = qb.whereILike('name', `%${query.search.trim()}%`);

    return await qb.withGraphFetched({ document: { attachments: true }, task_type: true, pipeline: true, assignees: { user: true }, company: true });
  }

  async getTaskWhereName(project_id: string, name: string, task_id: string) {
    return await this.model.query().where({ project_id, name, deleted_at: null }).where('id', '<>', task_id).first();
  }

  async getTaskStatusCounts(companyId: string, projectId?: string): Promise<TaskStatusCounts> {
    const query = this.model.query().where('company_id', companyId).whereNull('deleted_at');

    if (projectId) {
      query.where('project_id', projectId);
    }

    const result = await query
      .select([
        this.model.raw('COUNT(id) as total'),
        this.model.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed', ['completed']),
        this.model.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as in_progress', ['in_progress']),
        this.model.raw(
          `
            SUM(CASE WHEN 
                status != ? AND 
                end_date IS NOT NULL AND 
                end_date < NOW() 
                THEN 1 ELSE 0 END) as overdue
        `,
          [ProjectTaskStatus.COMPLETED],
        ),
      ])
      .first()
      .castTo<TaskStatusCounts>();

    return {
      total: Number(result?.total) || 0,
      completed: Number(result?.completed) || 0,
      in_progress: Number(result?.in_progress) || 0,
      overdue: Number(result?.overdue) || 0,
    };
  }
}
