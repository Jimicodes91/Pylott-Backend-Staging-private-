import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { UserService } from './services/user.service';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { StatusCodes } from 'http-status-codes';
import { UserRoles } from '@/shared/enums';

@injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  public getUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return errorResponse(res, 'User ID is required');
      }

      const user = await this.userService.getUser(userId);
      return successResponse(res, 'User fetched successfully', user);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public updateProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      // If a file was uploaded, convert it to base64 and set as pfp
      const file = (req as any).file;
      if (file) {
        const base64 = file.buffer.toString('base64');
        updateData.pfp = `data:${file.mimetype};base64,${base64}`;
      }

      if (!userId) {
        return errorResponse(res, 'User ID is required');
      }

      const updatedUser = await this.userService.updateUserProfile(userId, updateData);
      return successResponse(res, 'Profile updated successfully', updatedUser);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public addUserToCompany = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { companyId, role } = req.body;
      const adminId = (req as any).user.id; // The admin who is adding the user

      if (!userId || !companyId || !role) {
        return errorResponse(res, 'User ID, Company ID, and Role are required');
      }

      // Validate role
      if (!Object.values(UserRoles).includes(role)) {
        return errorResponse(res, 'Invalid role specified');
      }

      const result = await this.userService.addUserToCompany(userId, companyId, role, adminId);
      return successResponse(res, 'User added to company successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public getUserCompanies = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return errorResponse(res, 'User ID is required');
      }

      const userCompanies = await this.userService.getUserCompanies(userId);
      return successResponse(res, 'User companies fetched successfully', userCompanies);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public removeUserFromCompany = async (req: Request, res: Response) => {
    try {
      const { userId, companyId } = req.params;
      if (!userId || !companyId) {
        return errorResponse(res, 'User ID and Company ID are required');
      }

      const result = await this.userService.removeUserFromCompany(userId, companyId);
      return successResponse(res, 'User removed from company successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
