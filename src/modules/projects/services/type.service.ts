import { injectable } from 'tsyringe';

import { MilestonesRepository, ProjectTypeRepository } from '@/repositories';

import { MilestonesModelType } from '@/models';
import { FieldTypeEnum } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { _ProjectType, PhaseProgress } from '@/shared/types/projects.type';

@injectable()
export class TypeService {
  private traceId = '[TYPE SERVICE]';

  constructor(
    private readonly projectTypeRepository: ProjectTypeRepository,
    private readonly milestonesRepository: MilestonesRepository,
  ) {}

  async getAllProjectTypes(company_id: string): Promise<ServiceType> {
    try {
      const projectTypes = await this.projectTypeRepository.getAllProjectTypes(company_id);

      const remappedData = await Promise.all(
        projectTypes.map(async (projectType) => {
          const progress = this.calculatePhaseProgress(projectType.milestones);
          return {
            ...projectType,
            progress_metrics: progress,
          };
        }),
      );
      return { status: true, message: 'Project types fetched successfully', data: remappedData };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching project types ===> ${JSON.stringify({ company_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: [],
      };
    }
  }

  async getProjectTypeDetails(company_id: string, project_type_id: string): Promise<ServiceType> {
    try {
      const projectType = await this.projectTypeRepository.getProjectType(company_id, project_type_id);

      if (!projectType) return { status: false, message: 'Pipeline not found' };

      const progress = this.calculatePhaseProgress(projectType.milestones);

      return {
        status: true,
        message: 'Pipeline details fetched successfully',
        data: {
          ...projectType,
          progress_metrics: progress,
        },
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching Pipeline details ===> ${JSON.stringify({ company_id, project_type_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async createProjectType(company_id: string, payload: _ProjectType, is_system: boolean = false): Promise<ServiceType> {
    try {
      const existingProjectType = await this.projectTypeRepository.findOne({
        company_id,
        name: payload.name,
        deleted_at: null,
      });

      if (existingProjectType) {
        return {
          status: false,
          message: 'A Pipeline with this name already exists',
        };
      }

      const projectTypeCreateData = {
        company_id,
        name: payload.name,
        is_system,
      };
      const createdType = await this.projectTypeRepository.create(projectTypeCreateData);

      if (payload.stages && payload.stages.length > 0) {
        for (let i = 0; i < payload.stages.length; i++) {
          const stage = payload.stages[i];
          const milestoneData = {
            project_type_id: createdType.id,
            company_id,
            is_system,
            completed_at: null,
            name: stage.name,
            duration: stage.duration,
            order: i + 1,
          };

          await this.milestonesRepository.create(milestoneData);
        }
      }

      return {
        status: true,
        message: 'Pipeline created successfully',
        data: createdType,
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred creating Pipeline ===> ${JSON.stringify({ company_id, payload, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async updateProjectTypeDetails(company_id: string, project_type_id: string, updateData: Partial<_ProjectType>): Promise<ServiceType> {
    try {
      const existingProjectType = await this.projectTypeRepository.findOne({
        company_id,
        id: project_type_id,
        deleted_at: null,
      });

      if (!existingProjectType) return { status: false, message: 'Pipeline not found', statusCode: 404 };
      if (existingProjectType.is_system) return { status: false, message: 'Cannot modify system-defined project types' };

      if (updateData.name) {
        const nameExists = await this.projectTypeRepository.findOneWhereNameEquals(updateData.name, company_id, project_type_id);
        if (nameExists) {
          return {
            status: false,
            message: 'A Pipeline with this name already exists',
          };
        }
      }

      const updatedType = await this.projectTypeRepository.update({ id: project_type_id }, { ...updateData, company_id });

      return {
        status: true,
        message: 'Pipeline updated successfully',
        data: updatedType,
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred updating Pipeline ===> ${JSON.stringify({ company_id, project_type_id, updateData, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  private validateCustomFields(fields: any[]): ServiceType | null {
    if (!Array.isArray(fields)) {
      return {
        status: false,
        message: 'Custom fields must be an array',
        statusCode: 400,
      };
    }

    const fieldKeys = new Set<string>();
    for (const field of fields) {
      if (!field.name || !field.field_key || !field.field_type) {
        return {
          status: false,
          message: 'Each custom field must have name, field_key, and field_type',
          statusCode: 400,
        };
      }

      if (fieldKeys.has(field.field_key)) {
        return {
          status: false,
          message: `Duplicate field key: ${field.field_key}`,
          statusCode: 400,
        };
      }
      fieldKeys.add(field.field_key);

      switch (field.field_type) {
        case FieldTypeEnum.SELECT:
          if (!field.options || !Array.isArray(field.options)) {
            return {
              status: false,
              message: `Select field "${field.name}" requires an array of options`,
              statusCode: 400,
            };
          }
          break;
        case FieldTypeEnum.FILE:
          if (field.options?.multiple && typeof field.options.multiple !== 'boolean') {
            return {
              status: false,
              message: `File field "${field.name}" has invalid multiple option`,
              statusCode: 400,
            };
          }
          break;
      }
    }

    return null;
  }

  async reorderMilestones(company_id: string, project_type_id: string, milestoneIds: string[]): Promise<ServiceType> {
    try {
      const projectType = await this.projectTypeRepository.findOne({
        company_id,
        id: project_type_id,
        deleted_at: null,
      });

      if (!projectType) {
        return { status: false, message: 'Project type not found', statusCode: 404 };
      }

      if (projectType.is_system) {
        return { status: false, message: 'Cannot reorder milestones for system-defined project types', statusCode: 400 };
      }

      const milestones = await this.milestonesRepository.getAllMilestones(company_id, project_type_id);

      if (milestones.length !== milestoneIds.length) {
        return {
          status: false,
          message: 'All milestones must be included in the reorder request',
          statusCode: 400,
        };
      }

      const milestoneIdsSet = new Set(milestoneIds);
      const existingMilestoneIds = milestones.map((m) => m.id);

      for (const id of milestoneIdsSet) {
        if (!existingMilestoneIds.includes(id)) {
          return {
            status: false,
            message: `Milestone with ID ${id} not found for this project type`,
            statusCode: 400,
          };
        }
      }

      for (let i = 0; i < milestoneIds.length; i++) {
        await this.milestonesRepository.update({ id: milestoneIds[i], company_id, project_type_id }, { order: i + 1 });
      }

      return {
        status: true,
        message: 'Milestones reordered successfully',
        data: { reordered_milestones: milestoneIds },
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred reordering milestones ===> ${JSON.stringify({ company_id, project_type_id, milestoneIds, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
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

  async deleteProjectType(company_id: string, project_type_id: string): Promise<ServiceType> {
    try {
      const projectType = await this.projectTypeRepository.getProjectType(company_id, project_type_id);

      if (!projectType) {
        return {
          status: false,
          message: 'Journey not found',
          statusCode: 404,
        };
      }

      if (projectType.is_system) {
        return {
          status: false,
          message: 'Cannot delete system-defined journeys',
          statusCode: 403,
        };
      }

      const projectsCount = await this.projectTypeRepository.countActiveProjects(project_type_id);

      if (projectsCount > 0) {
        return {
          status: false,
          message: 'Cannot delete journey with active projects. Please reassign or complete all projects first',
          statusCode: 400,
        };
      }

      await this.milestonesRepository.delete({ project_type_id, company_id }, true);

      await this.projectTypeRepository.delete({ id: project_type_id, company_id }, true);

      return {
        status: true,
        message: 'Journey deleted successfully',
        statusCode: 200,
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred deleting journey ===> ${JSON.stringify({ company_id, project_type_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }
}
