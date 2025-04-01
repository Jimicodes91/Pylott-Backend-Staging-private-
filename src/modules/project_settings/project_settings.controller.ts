import { Response } from 'express';
import { injectable } from 'tsyringe';

import { genericResponse } from '@/shared/utils/api-response';
import { ToggleProjectSettings } from '@/shared/types/projects.type';
import { ProjectSettingService } from './services/project_settings.service';
import { AuthenticatedRequest } from '@/shared/types/express';

@injectable()
export class ProjectSettingController {
  constructor(private readonly projectSettingService: ProjectSettingService) {}

  toggleProjectSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { company_id } = req.user;
    const { project_id } = req.params;
    const payload = req.body as ToggleProjectSettings;

    const { statusCode = null, ...others } = await this.projectSettingService.toggleProjectSettings(company_id, project_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };

  getProjectSettingDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { company_id } = req.user;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.projectSettingService.getProjectSettingDetails(company_id, project_id);

    return genericResponse({ res, data: others, statusCode });
  };
}
