import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { successResponse } from '@/shared/utils/api-response';

@injectable()
export class CompanyController {
	constructor() {}

	create = async (req: Request, res: Response) => successResponse(res, 'Create company', {});
}
