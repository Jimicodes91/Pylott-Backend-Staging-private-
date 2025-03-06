import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { errorResponse, successResponse } from "../middleware/response.middleware";
import { createCompanyService } from "../services/company.service";

export const createCompany = async(req:Request, res:Response)=>{
    const validationErrors = validationResult(req);

    if (validationErrors.array().length > 0) {
      return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
    }

      // Ensure that req.user exists and has an id
  if (!(req as any).user) {
    return errorResponse(res, undefined, 'User authentication required', 401);
  }
  try{
    const createCompany = await createCompanyService(req.body);
    return successResponse(res, createCompany, `Company created successfully ✅`);

  }catch(error:any){
    return errorResponse(res, undefined, error.message, error.statusCode);
  }
}

