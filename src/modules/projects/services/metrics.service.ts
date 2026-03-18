import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { ProjectRepository, ProjectTaskRepository, ProjectTypeRepository } from '@/repositories';
import { MilestonesModelType } from '@/models/milestones.model';
import { PhaseProgress } from '@/shared/types/projects.type';
import { ServiceType } from '@/shared/types/general.type';

dayjs.extend(duration);

@injectable()
export class MetricsService {
  private traceId = '[METRICS SERVICE]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectTaskRepository: ProjectTaskRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async getDashboardMetrics(company_id: string): Promise<ServiceType> {
    try {
      const report = await this.projectRepository.getCombinedProjectAnalytics(company_id);

      let percentage_increase = 0;
      if (report.last_month_count > 0) {
        percentage_increase = ((report.current_month_count - report.last_month_count) / report.last_month_count) * 100;
      } else if (report.current_month_count > 0) {
        percentage_increase = 100;
      }

      const projectReport = {
        ...report,
        percentage_increase: Math.round(percentage_increase * 100) / 100,
      };

      const taskReport = await this.projectTaskRepository.getTaskStatusCounts(company_id);

      const recentProjects = await this.projectRepository.getRecentProject(company_id);

      const mappedRecentProjects = (recentProjects ?? []).map((project) => {
        const { id, name, status, start_date, milestone, project_type, form_data } = project;
        let milestoneDuration = 0;

        (project_type?.milestones ?? []).forEach((milestone) => {
          milestoneDuration += milestone.duration;
        });

        const expectedEndDate = dayjs(start_date).add(milestoneDuration, 'day').format('DD MMM, YYYY');

        const company = form_data?.['client_organization'] ?? '';
        const progress = this.calculatePhaseProgress(project_type?.milestones ?? []);

        return {
          id,
          name,
          status,
          start_date: dayjs(start_date).format('DD MMM, YYYY'),
          expected_end_date: expectedEndDate,
          milestone_id: milestone?.id,
          milestone_name: milestone?.name,
          progress,
          company,
        };
      });

      const topPipeline = await this.projectTypeRepository.getPipelineAnalyticsSingleQuery(company_id);

      const topClients = await this.projectRepository.getTopClients(company_id);

      return {
        status: true,
        message: 'Milestones fetched successfully',
        data: { project_report: projectReport, task_report: taskReport, recent_projects: mappedRecentProjects, top_pipeline: topPipeline, top_clients: topClients },
      };
    } catch (error) {
      console.error(
        `${this.traceId} Error occurred fetching project report ===> ${JSON.stringify({
          company_id,
          err_msg: error?.message,
          stack: error?.stack,
        })}`,
      );

      return {
        status: false,
        message: `An error occurred, please try again later: ${error?.message}`,
        data: [],
      };
    }
  }

  private calculatePhaseProgress(milestones: MilestonesModelType[]): PhaseProgress {
    let totalDays = 0;
    let completedDays = 0;
    let completedCount = 0;

    milestones.forEach((milestone) => {
      const duration = milestone.duration;

      totalDays += duration;

      if (milestone.completed_at) {
        completedDays += duration;
        completedCount++;
      }
    });

    return {
      days_to_completion: totalDays - completedDays,
      percentage_complete: milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0,
    };
  }
}
