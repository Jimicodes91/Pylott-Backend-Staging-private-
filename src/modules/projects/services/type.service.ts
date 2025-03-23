import { injectable } from 'tsyringe';

import { ProjectTypeRepository } from '@/repositories';
import { ServiceType } from '@/shared/types/general.type';
import { CreateProjectType } from '@/shared/types/projects.type';

@injectable()
export class TypeService {
  private traceId = '[TYPE SERVICE]';

  constructor(private readonly projectTypeRepository: ProjectTypeRepository) {}

  async getAllProjectTypes(company_id: string): Promise<ServiceType> {
    try {
      const projectTypes = await this.projectTypeRepository.findMany({ company_id });

      return { status: true, message: 'Project types fetched successfully', data: projectTypes };
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
      });

      if (!projectType) return { status: false, message: 'Project type not found' };

      return {
        status: true,
        message: 'Project type details fetched successfully',
        data: projectType,
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred fetching project type details ===> ${JSON.stringify({ company_id, project_type_id, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async createProjectType(company_id: string, payload: CreateProjectType, is_system: boolean = false): Promise<ServiceType> {
    try {
      const existingProjectType = await this.projectTypeRepository.findOne({
        company_id,
        ...payload,
      });

      if (existingProjectType)
        return {
          status: false,
          message: 'A project type with name already exists',
        };

      await this.projectTypeRepository.create({
        company_id,
        name: payload.name,
        is_system,
      });

      return {
        status: true,
        message: 'Project type created successfully',
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred creating project type ===> ${JSON.stringify({ company_id, name, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async updateProjectTypeDetails(company_id: string, project_type_id: string, updateData: Partial<CreateProjectType>): Promise<ServiceType> {
    try {
      const existingProjectType = await this.projectTypeRepository.findOne({
        company_id,
        id: project_type_id,
      });

      if (!existingProjectType) return { status: false, message: 'Project type not found', statusCode: 404 };

      if (existingProjectType.is_system) return { status: false, message: 'Cannot modify system-defined project types' };

      if (updateData.name) {
        const nameExists = await this.projectTypeRepository.findOneWhereNameEquals(updateData.name, company_id, project_type_id);

        if (nameExists) {
          return {
            status: false,
            message: 'A project type with this name already exists',
          };
        }
      }

      await this.projectTypeRepository.update({ id: project_type_id, company_id }, updateData);

      return {
        status: true,
        message: 'Project type updated successfully',
      };
    } catch (error) {
      console.log(`${this.traceId} Error occurred updating project type ===> ${JSON.stringify({ company_id, project_type_id, updateData, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }
}
