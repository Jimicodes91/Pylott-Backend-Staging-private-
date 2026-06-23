import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models/user.model';
import { AuthenticatedRequest } from '@/shared/types/express';
import { genericResponse } from '@/shared/utils/api-response';
import { FormLinkService } from './services/form-link.service';
import { NativeformsSubmissionService } from './services/nativeforms-submission.service';

const NATIVEFORMS_WEBHOOK_SECRET = process.env.NATIVEFORMS_WEBHOOK_SECRET || '';
const WEBHOOK_MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

@injectable()
export class NativeformsController {
  constructor(
    private readonly formLinkService: FormLinkService,
    private readonly submissionService: NativeformsSubmissionService,
  ) {}

  // ─── Form Link CRUD (Admin-only) ─────────────────────────────────

  getFormLinks = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const result = await this.formLinkService.getAll(user.company_id);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  getFormLink = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { id } = req.params;
    const result = await this.formLinkService.getById(user.company_id, id);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  createFormLink = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const result = await this.formLinkService.create(user.company_id, req.body);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  updateFormLink = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { id } = req.params;
    const result = await this.formLinkService.update(user.company_id, id, req.body);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  deleteFormLink = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { id } = req.params;
    const result = await this.formLinkService.softDelete(user.company_id, id);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  // ─── Client-facing Endpoints ─────────────────────────────────────

  getFormLinksByProject = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { projectId } = req.params;
    const projectTypeId = (req.query.project_type_id as string) || '';
    const milestoneId = (req.query.milestone_id as string) || '';
    const result = await this.formLinkService.getByProject(user.company_id, projectTypeId, milestoneId);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  getSubmissionsByProject = async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const result = await this.submissionService.getByProject(projectId);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  checkSubmission = async (req: AuthenticatedRequest, res: Response) => {
    const { formLinkId, projectId } = req.params;
    const result = await this.submissionService.checkSubmission(formLinkId, projectId);
    return genericResponse({ res, data: result, statusCode: result.statusCode });
  };

  // ─── Webhook (Public, secret-validated) ────────────────────────────

  handleWebhook = async (req: Request, res: Response) => {
    // Check payload size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > WEBHOOK_MAX_BODY_SIZE) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const providedSecret = (req.headers['x-nativeforms-secret'] as string) || '';
    const payload = req.body;

    const result = await this.submissionService.processWebhook(NATIVEFORMS_WEBHOOK_SECRET, providedSecret, payload);

    if (!result.status) {
      return res.status(result.statusCode || 500).json({ error: result.message });
    }

    return res.status(200).json({});
  };
}
