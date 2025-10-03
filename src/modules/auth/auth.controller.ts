import { injectable } from 'tsyringe';
import { Response, Request, NextFunction } from 'express';

import { AuthService } from './services/auth.service';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import HttpError from '@/shared/utils/errorHandler';
import { StatusCodes } from 'http-status-codes';

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signUpAdmin = async (req: Request, res: Response) => {
    try {
      const newUser = await this.authService.adminSignup(req.body);
      return successResponse(res, 'Admin created successfully', newUser);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public signUpCompanyAdmin = async (req: Request, res: Response) => {
    try {
      const newUser = await this.authService.companyAdminSignup(req.body);
      return successResponse(res, 'User created successfully ✅, check email to verify account', newUser);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
  public signIn = async (req: Request, res: Response) => {
    try {
      const loginData = await this.authService.signIn(req.body);
      return successResponse(res, 'User logged in successfully ✅', loginData);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return errorResponse(res, 'Token is required');
      }

      const result = await this.authService.verifyEmail(token);
      return successResponse(res, 'Email verified successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public resendVerificationEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return errorResponse(res, 'Email is required');
      }

      const result = await this.authService.resendVerificationEmail(email);
      return successResponse(res, 'Verification email sent successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return errorResponse(res, 'Email is required');
      }

      const result = await this.authService.forgotPassword(email);
      return successResponse(res, 'Password reset email sent successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return errorResponse(res, 'Token and new password are required');
      }

      const result = await this.authService.resetPassword(token, newPassword);
      return successResponse(res, 'Password reset successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public sendInvite = async (req: Request, res: Response) => {
    try {
      //console.log(req)
      const adminId = (req as any).user.id;

      if (!adminId) {
        return errorResponse(res, 'Admin Id is required');
      }
      const { email, role } = req.body;
      if (!adminId || !email || !role) {
        return errorResponse(res, 'email, and role are required');
      }
      const result = await this.authService.sendInvitation(adminId, email, role);
      return successResponse(res, 'Invitation sent successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public completeRegistration = async (req: Request, res: Response) => {
    try {
      const { token, password, name } = req.body;
      if (!token || !password || !name) {
        return errorResponse(res, 'Token, password, and name are required');
      }

      const result = await this.authService.completeRegistration(token, password, name);

      return successResponse(res, 'Registration completed successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };
  public addClient = async (req: Request, res: Response) => {
    try {
      const { name, email, companyId } = req.body;
      if (!name || !email || !companyId) {
        return errorResponse(res, 'Name, email, and company ID are required');
      }

      const result = await this.authService.addClient(name, email, companyId);
      return successResponse(res, 'Client added successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public updatePassword = async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        return errorResponse(res, 'User ID, current password, and new password are required');
      }

      const result = await this.authService.updatePassword(userId, currentPassword, newPassword);
      return successResponse(res, 'Password updated successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public getGoogleAuthURL = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authURL = this.authService.generateGoogleAuthURL();
      res.json({ authURL });
    } catch (error) {
      next(new HttpError(error.message, 500));
    }
  };

  // Handle Google callback and authentication
  public googleAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        throw new HttpError('Authorization code is required', 400);
      }

      // Verify Google token and get user info
      const googleUserData = await this.authService.verifyGoogleToken(code);

      // Complete authentication process
      const authResult = await this.authService.handleGoogleAuth(googleUserData);

      // Redirect to frontend with token (or send JSON response)
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${authResult.token}`);
    } catch (error) {
      next(new HttpError(error.message, 401));
    }
  };

  public inviteExistingUser = async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.id;

      if (!adminId) {
        return errorResponse(res, 'Admin Id is required');
      }
      const { email, role } = req.body;
      if (!adminId || !email || !role) {
        return errorResponse(res, 'email, and role are required');
      }
      const result = await this.authService.inviteExistingUser(adminId, email, role);
      return successResponse(res, 'User invited to company successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      if (!userId) {
        return errorResponse(res, 'User ID is required');
      }

      const result = await this.authService.logout(userId);
      return successResponse(res, 'Logged out successfully', result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  };

  //public signup = async (req: Request, res: Response) => successResponse(res, 'Sample response', {});
}
