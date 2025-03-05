import {Request,Response} from "express";
import { validationResult } from 'express-validator';
import { AdminSignup, verifyEmailService } from "../services/auth.service";
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