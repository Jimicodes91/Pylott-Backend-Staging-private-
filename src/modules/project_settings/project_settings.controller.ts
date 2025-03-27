import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { genericResponse } from '@/shared/utils/api-response';
import { UserModelType } from '@/models';
import { ToggleProjectSettings } from '@/shared/types/projects.type';
import { ProjectSettingService } from './services/project_settings.service';

@injectable()
export class ProjectSettingController {
  constructor(private readonly projectSettingService: ProjectSettingService) {}

  toggleProjectSettings = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const { company_id } = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as ToggleProjectSettings;

    const { statusCode = null, ...others } = await this.projectSettingService.toggleProjectSettings(company_id, project_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };

  getProjectSettingDetails = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const { company_id } = req.user as UserModelType;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.projectSettingService.getProjectSettingDetails(company_id, project_id);

    return genericResponse({ res, data: others, statusCode });
  };
}
