import { errorResponse, successResponse } from "../middleware/response.middleware";
import { getUser, updateUserProfileService } from "../services/user.service";
import {Request, Response} from "express"
import { validationResult } from "express-validator";
import HttpError from "../utils/errorHandler";



export const fetchUser = async (req: Request, res: Response) => {

    const userId = req.params?.userId

    if (!userId) {
        return errorResponse(res, undefined, 'Please provide user id', 400);
    }

    try {
        const user = await getUser(userId);
        
        return successResponse(res, user, 'user fetched successfully ✅');
    } catch (error: any) {
        return errorResponse(res, undefined, error.message, error.statusCode);
    }

}




export const updateUserProfile = async (req: Request, res: Response) => {
  // Step 1: Validate the request data
  const validationErrors = validationResult(req);
  if (validationErrors.array().length > 0) {
    return errorResponse(res, validationErrors.array(), "Check your form, make sure all fields are valid", 422);
  }

  try {
    const { name, email, pfp, language, currency } = req.body;
    const userId = req.params.userId; // User ID from the request params
    const loggedInUserId = (req as any).user._id; // Logged-in user's ID from the request object

    if (userId !== loggedInUserId.toString()) {
        throw new HttpError("You are not authorized to update this profile", 403);
      }


    // Step 2: Call the updateUserProfileService
    const updatedUser = await updateUserProfileService(userId, {
      name,
      email,
      pfp,
      language,
      currency
    });

    // Step 3: Return a success response
    return successResponse(res, updatedUser, "Profile updated successfully ✅");
  } catch (error: any) {
    // Step 4: Handle errors
    return errorResponse(res, undefined, error.message, error.statusCode || 500);
  }
};