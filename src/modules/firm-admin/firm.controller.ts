import { Response, Request } from 'express';
import { injectable } from 'tsyringe';

import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { ROLES_ALLOWED_IN_ADD_USER, UserRoles } from '@/shared/enums';
import HttpError from '@/shared/utils/errorHandler';
import { FirmAdminService } from './firm.service';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class FirmAdminController {
  constructor(private readonly firmAdminService: FirmAdminService) {}

  public addUser = async (req: Request, res: Response) => {
    try {
      const { name, email, role } = req.body;
      const companyId = (req as any).user.company_id; // From authenticated admin

      if (!Object.values(UserRoles).includes(role)) {
        throw new HttpError('Invalid user role', 400);
      }
      if (!ROLES_ALLOWED_IN_ADD_USER.includes(role as UserRoles)) {
        throw new HttpError('Only Admin and Consultant can be added here. Client creation is done from Contacts.', 400);
      }

      const user = await this.firmAdminService.addUser(name, email, role as UserRoles, companyId);

      return successResponse(res, 'User added successfully. Temporary password sent via email.', user);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
