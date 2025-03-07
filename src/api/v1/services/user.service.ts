import User from "../models/user.model";
import HttpError from "../utils/errorHandler";
import { UserUpdateData } from "../utils/user";


export const updateUserProfileService = async (
  userId: string,
  updateData: UserUpdateData
) => {
  try {
    
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError("User not found", 404);
    }

  
    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.pfp) user.pfp = updateData.pfp;
    if(updateData.currency) user.currency = updateData.currency;
    if(updateData.language) user.language = updateData.language;

    await user.save();

    user.password = "";
    return user;
  } catch (error: any) {
    throw new HttpError(error.message || "Failed to update profile", 500);
  }
};

export const getUser = async (userId: string) => {
    try {
        const user = await User.findOne({ _id: userId })

        if (!user) {
            throw new HttpError('User not found', 404)
        }
        
        return user
    } catch (error: any) {
        console.error("Error getting single user:", error);
        throw new HttpError(error.message || "Server error, please try again later", error.statusCode || 500);
    }
}