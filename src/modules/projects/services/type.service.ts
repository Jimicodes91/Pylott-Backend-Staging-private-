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
    private readonly milestoneRepository: MilestonesRepository,
  ) {}

  async getAllProjectTypes(company_id: string): Promise<ServiceType> {
    try {
      const projectTypes = await this.projectTypeRepository.findMany({ company_id, deleted_at: null });

      const remappedData = await Promise.all(
        projectTypes.map(async (projectType) => {
          const milestones = await this.milestoneRepository.getAllMilestones(company_id, projectType.id);

          const progress = this.calculatePhaseProgress(milestones);
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
      const projectType = await this.projectTypeRepository.findOne({
        company_id,
        id: project_type_id,
        deleted_at: null,
      });

      if (!projectType) return { status: false, message: 'Pipeline not found' };

      const milestones = await this.milestoneRepository.getAllMilestones(company_id, project_type_id);
      const progress = this.calculatePhaseProgress(milestones);

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

      const createdType = await this.projectTypeRepository.create({
        company_id,
        name: payload.name,
        is_system,
      });

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

      const updatedType = await this.projectTypeRepository.update({ id: project_type_id, company_id }, updateData);

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
