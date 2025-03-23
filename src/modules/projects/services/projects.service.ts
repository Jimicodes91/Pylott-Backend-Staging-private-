import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import { ProjectRepository, MilestonesRepository, ClientRepository, ProjectTypeRepository, MilestoneStagesRepository } from '@/repositories';

import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { UserModelType } from '@/models';
import { CreateProjectType } from '@/shared/types/projects.type';
import { ProjectStatus } from '@/shared/enums';

// @todo - Project routes, validation, migration and testing

@injectable()
export class ProjectService {
  private traceId = '[PROJECT SERVICE]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly milestonesRepository: MilestonesRepository,
    private readonly mileStoneStagesRepository: MilestoneStagesRepository,
    private readonly clientRepository: ClientRepository,
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async getAllProjects(
    company_id: string,
    filters: {
      status?: string;
      client_id?: string;
      consultant_id?: string;
      project_type_id?: string;
    } = {},
  ): Promise<ServiceType> {
    try {
      const query: ObjectLiteral = { company_id };

      if (filters.status) query.status = filters.status;
      if (filters.client_id) query.client_id = filters.client_id;
      if (filters.consultant_id) query.consultant_id = filters.consultant_id;
      if (filters.project_type_id) query.project_type_id = filters.project_type_id;

      const projects = await this.projectRepository.getProjectsAndAssociatedEntities(query);

      const projectsWithTimeline = this.formatProjectsWithTimeline(projects);

      return {
        status: true,
        message: 'Projects fetched successfully',
        data: projectsWithTimeline,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching projects ===> ${JSON.stringify({
          company_id,
          filters,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getProject(company_id: string, project_id: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.getProjectDetails(company_id, project_id);

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const projectWithTimeline = this.formatProjectWithTimeline(project);

      return {
        status: true,
        message: 'Project fetched successfully',
        data: projectWithTimeline,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching project ===> ${JSON.stringify({
          company_id,
          project_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async createProject(user: UserModelType, payload: CreateProjectType): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      const client = await this.clientRepository.findOne({
        id: payload.client_id,
        company_id,
      });

      if (!client) {
        return {
          status: false,
          message: 'Client not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const projectType = await this.projectTypeRepository.findOne({
        id: payload.project_type_id,
        company_id,
      });

      if (!projectType) {
        return {
          status: false,
          message: 'Project type not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.milestone_id) {
        const milestone = await this.milestonesRepository.findOne({
          id: payload.milestone_id,
          company_id,
        });

        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        if (milestone.project_type_id !== payload.project_type_id) {
          return {
            status: false,
            message: 'Milestone is not compatible with selected project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }

        if (payload.stage_id) {
          const stage = await this.mileStoneStagesRepository.findOne({
            milestone_id: payload.milestone_id,
            company_id,
            id: payload.stage_id,
          });

          if (!stage) {
            return {
              status: false,
              message: 'Milestone stage not found',
              statusCode: StatusCodes.NOT_FOUND,
            };
          }
        }
      }

      const project = await this.projectRepository.create({
        company_id,
        name: payload.name.trim(),
        description: payload.description || '',
        client_id: payload.client_id,
        consultant_id: payload.consultant_id,
        project_type_id: payload.project_type_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        milestone_id: payload.milestone_id || null,
        stage_id: payload.stage_id,
        status: payload.status || ProjectStatus.NOT_STARTED,
        created_by: user.id,
      });

      return {
        status: true,
        message: 'Project created successfully',
        statusCode: StatusCodes.CREATED,
        data: this.formatProjectWithTimeline(project),
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred creating project ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async updateProject(user: UserModelType, project_id: string, payload: Partial<CreateProjectType>): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      const project = await this.projectRepository.findOne({
        id: project_id,
        company_id,
      });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (payload.client_id) {
        const client = await this.clientRepository.findOne({
          id: payload.client_id,
          company_id,
        });

        if (!client) {
          return {
            status: false,
            message: 'Client not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      if (payload.project_type_id) {
        const projectType = await this.projectTypeRepository.findOne({
          id: payload.project_type_id,
          company_id,
        });

        if (!projectType) {
          return {
            status: false,
            message: 'Project type not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        if (payload.project_type_id !== project.project_type_id) {
          if (project.milestone_id) {
            const milestone = await this.milestonesRepository.findOne({
              id: project.milestone_id,
            });

            if (milestone && milestone.project_type_id !== payload.project_type_id) {
              payload.milestone_id = null;
              payload.stage_id = null;
            }
          }
        }
      }

      if (payload.milestone_id) {
        const milestone = await this.milestonesRepository.findOne({
          id: payload.milestone_id,
          company_id,
        });

        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        // Validate milestone is compatible with project type
        const projectTypeId = payload.project_type_id || project.project_type_id;
        if (milestone.project_type_id !== projectTypeId) {
          return {
            status: false,
            message: 'Milestone is not compatible with this project type',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }

        // If changing milestone, reset stage or validate stage compatibility
        if (payload.milestone_id !== project.milestone_id) {
          // If stage_id is provided, validate it
          if (payload.stage_id) {
            const stage = await this.mileStoneStagesRepository.findOne({
              id: payload.stage_id,
              milestone_id: payload.milestone_id,
              company_id,
            });

            if (!stage) {
              return {
                status: false,
                message: 'Stage not found or not compatible with selected milestone',
                statusCode: StatusCodes.BAD_REQUEST,
              };
            }
          } else {
            // Get default stage for this milestone
            const stages = await this.mileStoneStagesRepository.findMany({
              milestone_id: payload.milestone_id,
              company_id,
            });

            if (stages.length > 0) {
              payload.stage_id = stages[0].id;
            } else {
              payload.stage_id = null;
            }
          }
        }
      }

      if (payload.stage_id && !payload.milestone_id) {
        const stage = await this.mileStoneStagesRepository.findOne({
          id: payload.stage_id,
          company_id,
        });

        if (!stage) {
          return {
            status: false,
            message: 'Stage not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }

        if (stage.milestone_id !== project.milestone_id) {
          return {
            status: false,
            message: 'Stage is not part of the current milestone',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      let completedAt = project?.completed_at;
      if (payload.status) {
        const validStatuses = Object.values(ProjectStatus);
        if (!validStatuses.includes(payload.status as ProjectStatus)) {
          return {
            status: false,
            message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }

        // Update completed_at timestamp based on status changes
        if (payload.status === ProjectStatus.COMPLETED && project.status !== ProjectStatus.COMPLETED) {
          completedAt = new Date().toISOString();
        } else if (payload.status !== ProjectStatus.COMPLETED && project.status === ProjectStatus.COMPLETED) {
          completedAt = null;
        }
      }

      //@todo Add audit info
      const updateData = {
        ...payload,
        completed_at: completedAt,
        updated_by: user.id,
      };

      const updatedProject = await this.projectRepository.update({ id: project_id, company_id }, updateData);

      return {
        status: true,
        message: 'Project updated successfully',
        data: this.formatProjectWithTimeline(updatedProject),
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred updating project ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          project_id,
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  private formatProjectWithTimeline(project: any): any {
    if (!project) return null;

    return {
      ...project,
      timeline: this.calculateTimeline(project.start_date, project.end_date),
    };
  }

  private formatProjectsWithTimeline(projects: any[]): any[] {
    if (!projects || !Array.isArray(projects)) return [];

    return projects.map((project) => this.formatProjectWithTimeline(project));
  }

  private calculateTimeline(startDate: string, endDate: string): string {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      return 'Invalid date range';
    }

    const diff = end.diff(start);
    const duration = dayjs.duration(diff);

    const years = duration.years();
    const months = duration.months();
    const days = duration.days();

    if (years > 0) {
      if (months > 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    if (months > 0) {
      if (days > 0) {
        return `${months} ${months === 1 ? 'month' : 'months'}, ${days} ${days === 1 ? 'day' : 'days'}`;
      }
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    return '1 day';
  }
}
