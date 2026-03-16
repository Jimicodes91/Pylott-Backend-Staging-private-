import { container, injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTask, ProjectTaskModelType } from '@/models/project_task.model';
import { TaskStatusCounts } from '@/shared/interface/model';
import { ProjectTaskStatus } from '@/shared/enums';
import { ObjectLiteral } from '@/shared/types/general.type';
import { ProjectTaskAssigneesRepository } from './project_task_asignees.repository';

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
    let assignedTaskIds: string[] = [];

    if (query.assignee_id) {
      const projectTaskAssigneeRepository = container.resolve(ProjectTaskAssigneesRepository);
      const assignments = await projectTaskAssigneeRepository.findMany({
        project_id,
        assignee_id: query.assignee_id,
      });
      assignedTaskIds = assignments.map((pta) => pta.task_id);
    }

    const qb = this.model.query().where({ company_id, deleted_at: null });

    if (project_id) {
      qb.where({ project_id });
    }

    if (query.assignee_id && !query.is_visible_to_client) {
      qb.whereIn('id', assignedTaskIds);
    } else if (query.assignee_id && query.is_visible_to_client) {
      qb.where((builder) => {
        builder.whereIn('id', assignedTaskIds).orWhere('is_visible_to_client', query.is_visible_to_client);
      });
    }

    // Filter by Inhouse (false) vs Client facing (true) when explicitly requested
    if (query.assignee_id == null && (query.is_visible_to_client === true || query.is_visible_to_client === false)) {
      qb.where('is_visible_to_client', query.is_visible_to_client);
    }

    if (query.search) {
      qb.whereILike('name', `%${query.search.trim()}%`);
    }

    return await qb.withGraphFetched({
      document: { attachments: true },
      task_type: true,
      pipeline: true,
      assignees: { user: true },
      company: true,
    });
  }

  async getTaskWhereName(project_id: string, name: string, task_id: string) {
    return await this.model.query().where({ project_id, name, deleted_at: null }).where('id', '<>', task_id).first();
  }

  /** Count of tasks assigned to the given user that are not completed (for sidebar badge / notification count). */
  async getIncompleteCountAssignedToUser(companyId: string, userId: string): Promise<number> {
    const result = await this.model
      .query()
      .join('project_task_assignees', 'project_tasks.id', 'project_task_assignees.task_id')
      .where('project_tasks.company_id', companyId)
      .where('project_task_assignees.assignee_id', userId)
      .whereNull('project_tasks.deleted_at')
      .whereNull('project_task_assignees.deleted_at')
      .whereNot('project_tasks.status', ProjectTaskStatus.COMPLETED)
      .count('project_tasks.id as count')
      .first();
    return Number((result as any)?.count ?? 0);
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
        this.model.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending', ['pending']),
        this.model.raw(
          `
            SUM(CASE WHEN 
                status != ? AND 
                due_date IS NOT NULL AND 
                due_date < NOW() 
                THEN 1 ELSE 0 END) as overdue
        `,
          [ProjectTaskStatus.COMPLETED],
        ),
      ])
      .first()
      .castTo<TaskStatusCounts & { in_progress?: number }>();

    return {
      total: Number(result?.total) || 0,
      completed: Number(result?.completed) || 0,
      in_progress: 0, // Only pending and completed states (requirement #13.2)
      pending: Number(result?.pending) || 0,
      overdue: Number(result?.overdue) || 0,
    };
  }
}
