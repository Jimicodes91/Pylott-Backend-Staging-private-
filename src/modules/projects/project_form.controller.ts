import { Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models/user.model';
import { AuthenticatedRequest } from '@/shared/types/express';
import { genericResponse } from '@/shared/utils/api-response';
import { ProjectFormService } from './services/forms.service';

@injectable()
export class ProjectFormController {
  constructor(private readonly projectFormService: ProjectFormService) {}

  getProjectForm = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const { statusCode = null, ...others } = await this.projectFormService.getProjectForm(company_id);
    return genericResponse({ res, data: others, statusCode });
  };

  addCustomField = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const payload = req.body;
    const { statusCode = null, ...others } = await this.projectFormService.addCustomField(company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateFieldRequirement = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const { field_id } = req.params;
    const { is_required } = req.body;
    const { statusCode = null, ...others } = await this.projectFormService.updateFieldRequirement(company_id, field_id, is_required);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllFormFields = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const formResponse = await this.projectFormService.getProjectForm(company_id);

    if (!formResponse.status) {
      return genericResponse({
        res,
        data: formResponse,
        statusCode: 404,
      });
    }

    return genericResponse({
      res,
      data: {
        status: true,
        message: 'Form fields fetched successfully',
        data: formResponse.data?.fields || [],
      },
    });
  };
}
