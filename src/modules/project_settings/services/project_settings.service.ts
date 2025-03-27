import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { ProjectRepository, ProjectSettingsRepository } from '@/repositories';

import { ServiceType } from '@/shared/types/general.type';
import { ToggleProjectSettings } from '@/shared/types/projects.type';

@injectable()
export class ProjectSettingService {
  private traceId = '[PROJECT SETTINGS SERVICE]';

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
  ) {}

  async toggleProjectSettings(company_id: string, project_id: string, payload: ToggleProjectSettings): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({ company_id, id: project_id });

      if (!project) return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };

      let projectSettings = await this.projectSettingsRepository.findOne({ project_id });

      if (!projectSettings) projectSettings = await this.projectSettingsRepository.create({ company_id, project_id });

      await this.projectSettingsRepository.update({ id: projectSettings.id, company_id, project_id }, payload);

      return { status: true, message: 'Project settings updated successfully' };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred toggling project settings ===> ${JSON.stringify({
          company_id,
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

  async getProjectSettingDetails(company_id: string, project_id: string): Promise<ServiceType> {
    try {
      const projectSettings = await this.projectSettingsRepository.findOne({ project_id });

      return { status: true, message: 'Project settings fetched successfully', data: projectSettings };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching project settings ===> ${JSON.stringify({
          company_id,
          project_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}
