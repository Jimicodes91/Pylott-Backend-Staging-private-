import { UserRepository } from '@/repositories';
import { UserUpdateData } from '@/shared/interface/user';
import HttpError from '@/shared/utils/errorHandler';
import { inject, injectable } from 'tsyringe';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { DocumentsDirectory } from '@/shared/enums';

@injectable()
export class UserService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(Cloudinary) private cloudinary: Cloudinary,
  ) {}
  public async getUser(id: string) {
    try {
      const user = await this.userRepository.getUserDetails(id);
      if (!user) {
        throw new HttpError('User not found', 404);
      }
      return user;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch user', 500);
    }
  }

  public async updateUserProfile(userId: string, updateData: UserUpdateData) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Update fields if they exist in the updateData
      if (updateData.name) user.name = updateData.name;
      if (updateData.phone_number) user.phone_number = updateData.phone_number;
      if (updateData.email) user.email = updateData.email;
      if (updateData.pfp) {
        // If pfp is a base64 string and not a URL, upload to Cloudinary
        if (!updateData.pfp.includes('http')) {
          const fileName = `${userId}-profile-picture`;
          const { status, data } = await this.cloudinary.upload(
            DocumentsDirectory.PROFILE_PICTURES, // Use PROJECTS or create a new enum for profile pictures if needed
            updateData.pfp,
            fileName,
          );
          if (status && data) {
            user.pfp = data;
          } else {
            throw new HttpError('Failed to upload profile picture', 500);
          }
        } else {
          user.pfp = updateData.pfp;
        }
      }
      if (updateData.currency) user.currency = updateData.currency;
      if (updateData.language) user.language = updateData.language;

      await this.userRepository.update({ id: userId }, user);
      return user;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update profile', 500);
    }
  }
}
