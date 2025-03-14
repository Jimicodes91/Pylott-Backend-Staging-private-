import { injectable } from 'tsyringe';
import { Response, Request } from 'express';

import { AuthService } from './services/auth.service';
import { errorResponse, successResponse } from '@/shared/utils/api-response';

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signUpAdmin = async (req: Request, res: Response) => {
    try {
      const newUser = await this.authService.adminSignup(req.body);
      return successResponse(res, 'Admin created successfully', newUser);
    } catch (error: any) {
      return errorResponse(res, 'SUPER_ADMIN_SIGNUP_ERROR', error.message, error.statusCode);
    }
  };

  public signUpCompanyAdmin = async (req: Request, res: Response) => {
    try {
      const newUser = await this.authService.companyAdminSignup(req.body);
      return successResponse(res, 'User created successfully ✅, check email to verify account', newUser);
    } catch (error: any) {
      return errorResponse(res, 'ADMIN_SIGNUP_ERROR', error.message, error.statusCode);
    }
  };
  public signIn = async (req: Request, res: Response) => {
    try {
      const loginData = await this.authService.signIn(req.body);
      return successResponse(res, 'User logged in successfully ✅', loginData);
    } catch (error: any) {
      return errorResponse(res, 'LOGIN_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'VERIFY_EMAIL_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'RESEND_VERIFICATION_EMAIL_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'FORGOT_PASSWORD_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'RESET_PASSWORD_ERROR', error.message, error.statusCode);
    }
  };

  public sendInvite = async (req: Request, res: Response) => {
    try {
      const { adminId, email, role } = req.body;
      if (!adminId || !email || !role) {
        return errorResponse(res, 'Admin ID, email, and role are required');
      }
      const result = await this.authService.sendInvitation(adminId, email, role);
      return successResponse(res, 'Invitation sent successfully', result);
    } catch (error: any) {
      return errorResponse(res, 'SEND_INVITE_ERROR', error.message, error.statusCode);
    }
  };

  public completeRegistration = async (req: Request, res: Response) => {
    try {
      const { email, password, companyId } = req.body;
      if (!email || !password || !companyId) {
        return errorResponse(res, 'Email, password, and company ID are required');
      }

      const result = await this.authService.completeRegistration(email, password, companyId);
      return successResponse(res, 'Registration completed successfully', result);
    } catch (error: any) {
      return errorResponse(res, 'COMPLETE_REGISTRATION_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'ADD_CLIENT_ERROR', error.message, error.statusCode);
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
      return errorResponse(res, 'UPDATE_PASSWORD_ERROR', error.message, error.statusCode);
    }
  };

  //public signup = async (req: Request, res: Response) => successResponse(res, 'Sample response', {});
}
