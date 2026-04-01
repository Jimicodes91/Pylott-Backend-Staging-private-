import { Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models/user.model';
import { AuthenticatedRequest } from '@/shared/types/express';
import { genericResponse } from '@/shared/utils/api-response';
import { FormTemplateService } from './services/form-template.service';
import { FormFieldService } from './services/form-field.service';
import { FormVersionService } from './services/form-version.service';
import { FormSubmissionService } from './services/form-submission.service';
import { PreFillService } from './services/pre-fill.service';

@injectable()
export class FormsController {
  constructor(
    private readonly templateService: FormTemplateService,
    private readonly fieldService: FormFieldService,
    private readonly versionService: FormVersionService,
    private readonly submissionService: FormSubmissionService,
    private readonly preFillService: PreFillService,
  ) {}

  // Template endpoints

  createTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { statusCode = null, ...others } = await this.templateService.create(user.company_id, user.id, req.body);
    return genericResponse({ res, data: others, statusCode });
  };

  getTemplates = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const search = req.query.search as string | undefined;
    const { statusCode = null, ...others } = await this.templateService.getAll(user.company_id, search);
    return genericResponse({ res, data: others, statusCode });
  };

  getTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.templateService.getById(user.company_id, template_id);
    return genericResponse({ res, data: others, statusCode });
  };

  updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.templateService.update(user.company_id, template_id, req.body);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.templateService.delete(user.company_id, template_id);
    return genericResponse({ res, data: others, statusCode });
  };

  cloneTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.templateService.clone(user.company_id, template_id, user.id);
    return genericResponse({ res, data: others, statusCode });
  };

  publishTemplate = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.templateService.publish(user.company_id, template_id, user.id);
    return genericResponse({ res, data: others, statusCode });
  };

  // Field endpoints

  createField = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.fieldService.create(template_id, req.body);
    return genericResponse({ res, data: others, statusCode });
  };

  updateField = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id, field_id } = req.params;
    const { statusCode = null, ...others } = await this.fieldService.update(field_id, template_id, req.body);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteField = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id, field_id } = req.params;
    const { statusCode = null, ...others } = await this.fieldService.delete(field_id, template_id);
    return genericResponse({ res, data: others, statusCode });
  };

  reorderFields = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id } = req.params;
    const { field_orders } = req.body;
    const { statusCode = null, ...others } = await this.fieldService.reorder(template_id, field_orders);
    return genericResponse({ res, data: others, statusCode });
  };

  // Version endpoints

  getVersions = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id } = req.params;
    const { statusCode = null, ...others } = await this.versionService.getVersions(template_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getVersion = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id, version_number } = req.params;
    const { statusCode = null, ...others } = await this.versionService.getVersion(template_id, parseInt(version_number));
    return genericResponse({ res, data: others, statusCode });
  };

  // Submission endpoints

  createSubmission = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const data = { ...req.body, company_id: user.company_id };
    const { statusCode = null, ...others } = await this.submissionService.create(data);
    return genericResponse({ res, data: others, statusCode });
  };

  getSubmissionsByTask = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { task_id } = req.params;
    const { statusCode = null, ...others } = await this.submissionService.getByTask(task_id, user.company_id);
    return genericResponse({ res, data: others, statusCode });
  };

  finalizeSubmission = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { submission_id } = req.params;
    const { statusCode = null, ...others } = await this.submissionService.finalize(submission_id, user.company_id);
    return genericResponse({ res, data: others, statusCode });
  };

  // Pre-fill endpoint

  getPreFillData = async (req: AuthenticatedRequest, res: Response) => {
    const { template_id, client_id } = req.params;
    const { statusCode = null, ...others } = await this.preFillService.getPreFillData(client_id, template_id);
    return genericResponse({ res, data: others, statusCode });
  };
}
