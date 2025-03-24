import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { AuditTrailFilter } from '@/shared/types/projects.type';
import { genericResponse } from '@/shared/utils/api-response';
import { AuditTrailService } from './services/audit_trail.service';
import { UserModelType } from '@/models';

@injectable()
export class AuditTrailController {
  constructor(private readonly auditTrailService: AuditTrailService) {}

  getAuditTrail = async (req: Request, res: Response): Promise<void> => {
    const { project_id } = req.params;
    // @ts-ignore
    const { company_id } = req.user as UserModelType;
    const filters = req.query as unknown as AuditTrailFilter;

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const { statusCode = null, ...others } = await this.auditTrailService.getAuditTrail(company_id, project_id, filters, pagination);

    return genericResponse({ res, data: others, statusCode });
  };
}
