import {Request,Response} from "express";
import { validationResult } from 'express-validator';
import { AdminSignup, forgotPasswordService, resendVerificationEmailService, resetPasswordService, signIn, verifyEmailService } from "../services/auth.service";
import { errorResponse, successResponse } from "../middleware/response.middleware";

/**
 * Sign up a new user.
 * @param req - Express request object
 * @param res - Express response object
 * @returns Response with success or error message
 */
export const SignUpAdmin = async (req:Request, res:Response)=>{
    const validationErrors = validationResult(req);
    if (validationErrors.array().length > 0) {
        return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
      }
      try {
        const newUser = await AdminSignup(req.body);
        return successResponse(res, newUser, 'User created successfully ✅, check email to verify account');
      } catch (error: any) {
        return errorResponse(res, undefined, error.message, error.statusCode);
      }
 
}

export const signInUser = async (req: Request, res: Response) => {
    const validationErrors = validationResult(req);
  
    if (validationErrors.array().length > 0) {
      return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
    }
  
    try {
      const loginData = await signIn(req.body);
      return successResponse(res, loginData, 'User logged in successfully ✅');
    } catch (error: any) {
      return errorResponse(res, undefined, error.message, error.statusCode);
    }
  };

export const verifyEmail = async (req: Request, res: Response) => {
 
    const { token } = req.query;
    
  
    try {
        if (!token) {
            return errorResponse(res, undefined, "Token is required", 400);
          }

          const user = await verifyEmailService(token as string)
          return successResponse(res, user, "email verified successfully", 200)
  
    } catch (error: any) {
        return errorResponse(res, undefined, error.message, error.statusCode);
    }
  };

  export const resendVerificationEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
  
    if (!email) {
      return errorResponse(res, "Email is required", "VALIDATION_ERROR", 400);
    }
  
    try {
      const response = await resendVerificationEmailService(email);
      return successResponse(res, response, "Verification email sent", 200);
    } catch (error: any) {
      return errorResponse(res, error.message, "EMAIL_ERROR", error.statusCode || 500);
    }
  };

  export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
  
    try {
      if (!email) {
        return errorResponse(res,"Email is required","VALIDATION_ERROR", 400);
      }
  
      const result = await forgotPasswordService(email);
      return successResponse(res, result, "Forgot Password mail sent successfully", 200)
    } catch (error: any) {
        return errorResponse(res, error.message, "EMAIL_ERROR", error.statusCode || 500);
    }
  };
  export const resetPasswordController = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
  
    try {
      if (!token || !newPassword) {
        return errorResponse(res, undefined,"Token, email, and new password are required", 400);
      }
  
      const result = await resetPasswordService(token, newPassword);
      return successResponse(res, result, "Password successfully changed", 200)

    } catch (error: any) {
    return errorResponse(res, error.message, "EMAIL_ERROR", error.statusCode || 500);
    }
  };

