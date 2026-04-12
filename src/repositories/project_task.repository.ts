import { container, injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectTask, ProjectTaskModelType } from '@/models/project_task.model';
import { TaskStatusCounts, ContextualTaskReport } from '@/shared/interface/model';
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
      .withGraphFetched({ document: { attachments: true }, task_type: true, pipeline: true, assignees: { user: true }, company: true, contact: true })
      .first();
  }

  async getTaskById(company_id: string, project_id: string, task_id: string) {
    return await this.model.query().where({ company_id, project_id, id: task_id, deleted_at: null }).withGraphFetched({ assignees: true }).first();
  }

  async getTaskByIdOnly(company_id: string, task_id: string) {
    return await this.model.query().where({ company_id, id: task_id, deleted_at: null }).withGraphFetched({ assignees: true }).first();
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

    // Status filter: specific status or exclude archived by default
    if (query.status_filter) {
      qb.where('status', query.status_filter);
    } else if (query.exclude_archived) {
      qb.whereNot('status', ProjectTaskStatus.ARCHIVED);
    }

    // Task category type filter
    if (query.task_category_type_filter) {
      qb.where('task_category_type', query.task_category_type_filter);
    }

    // Context filter: standalone (organization) vs project-bound tasks
    if (query.context_filter === 'organization') {
      qb.whereNull('project_id');
    } else if (query.context_filter === 'project') {
      qb.whereNotNull('project_id');
    }

    return await qb.withGraphFetched({
      document: { attachments: true },
      task_type: true,
      pipeline: true,
      assignees: { user: true },
      company: true,
      contact: true,
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
      .whereNot('project_tasks.status', ProjectTaskStatus.ARCHIVED)
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

  async getContextualTaskReport(companyId: string): Promise<ContextualTaskReport> {
    const baseQuery = () => this.model.query().where('project_tasks.company_id', companyId).whereNull('project_tasks.deleted_at');

    const statusSelect = [
      this.model.raw('COUNT(project_tasks.id) as total'),
      this.model.raw('SUM(CASE WHEN project_tasks.status = ? THEN 1 ELSE 0 END) as completed', ['completed']),
      this.model.raw('SUM(CASE WHEN project_tasks.status = ? THEN 1 ELSE 0 END) as pending', ['pending']),
      this.model.raw(`SUM(CASE WHEN project_tasks.status != ? AND project_tasks.due_date IS NOT NULL AND project_tasks.due_date < NOW() THEN 1 ELSE 0 END) as overdue`, [ProjectTaskStatus.COMPLETED]),
    ];

    const toStatusCounts = (row: any): TaskStatusCounts => ({
      total: Number(row?.total) || 0,
      completed: Number(row?.completed) || 0,
      in_progress: 0,
      pending: Number(row?.pending) || 0,
      overdue: Number(row?.overdue) || 0,
    });

    // All tasks
    const allResult = await baseQuery().select(statusSelect).first();

    // Standalone tasks (project_id IS NULL)
    const standaloneResult = await baseQuery().whereNull('project_id').select(statusSelect).first();

    // Project tasks (project_id IS NOT NULL)
    const projectResult = await baseQuery().whereNotNull('project_id').select(statusSelect).first();

    // Project tasks by category (internal/external)
    const internalResult = await baseQuery().whereNotNull('project_id').where('task_category', 'internal').select(statusSelect).first();

    const externalResult = await baseQuery().whereNotNull('project_id').where('task_category', 'external').select(statusSelect).first();

    // Project tasks grouped by project_id with project name
    const byProjectRows = await baseQuery()
      .whereNotNull('project_tasks.project_id')
      .join('projects', 'project_tasks.project_id', 'projects.id')
      .select(['project_tasks.project_id', 'projects.name as project_name', ...statusSelect.map((s) => (typeof s === 'string' ? this.model.raw(s) : s))])
      .groupBy('project_tasks.project_id', 'projects.name');

    const projectByProject = (byProjectRows ?? []).map((row: any) => ({
      project_id: row.project_id,
      project_name: row.project_name || '',
      counts: toStatusCounts(row),
    }));

    return {
      all: toStatusCounts(allResult),
      standalone: toStatusCounts(standaloneResult),
      project: toStatusCounts(projectResult),
      project_by_category: {
        internal: toStatusCounts(internalResult),
        external: toStatusCounts(externalResult),
      },
      project_by_project: projectByProject,
    };
  }
}
