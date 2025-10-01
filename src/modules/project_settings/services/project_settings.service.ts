import { injectable } from 'tsyringe';

import { ProjectSettingsRepository } from '@/repositories';

import { ServiceType } from '@/shared/types/general.type';
import { ToggleProjectSettings } from '@/shared/types/projects.type';

@injectable()
export class ProjectSettingService {
  private traceId = '[PROJECT SETTINGS SERVICE]';

  constructor(private readonly projectSettingsRepository: ProjectSettingsRepository) {}

  async toggleProjectSettings(company_id: string, payload: ToggleProjectSettings): Promise<ServiceType> {
    try {
      let projectSettings = await this.projectSettingsRepository.getOne({ company_id });

      if (!projectSettings) projectSettings = await this.projectSettingsRepository.create({ company_id });

      await this.projectSettingsRepository.update({ id: projectSettings.id, company_id }, payload);

      return { status: true, message: 'Project settings updated successfully' };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred toggling project settings ===> ${JSON.stringify({
          company_id,
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

  async getProjectSettingDetails(company_id: string): Promise<ServiceType> {
    try {
      const projectSettings = await this.projectSettingsRepository.getOne({ company_id });

      return { status: true, message: 'Project settings fetched successfully', data: projectSettings };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching project settings ===> ${JSON.stringify({
          company_id,
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
