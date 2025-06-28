import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { UserService } from './services/user.service';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { StatusCodes } from 'http-status-codes';

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

      if (!userId) {
        return errorResponse(res, 'User ID is required');
      }

      const updatedUser = await this.userService.updateUserProfile(userId, updateData);
      return successResponse(res, 'Profile updated successfully', updatedUser);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
}
