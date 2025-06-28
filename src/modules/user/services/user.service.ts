import { UserRepository } from '@/repositories';
import { UserUpdateData } from '@/shared/interface/user';
import HttpError from '@/shared/utils/errorHandler';
import { inject, injectable } from 'tsyringe';

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}
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
      if (updateData.pfp) user.pfp = updateData.pfp;
      if (updateData.currency) user.currency = updateData.currency;
      if (updateData.language) user.language = updateData.language;

      await this.userRepository.update({ id: userId }, user);
      return user;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update profile', 500);
    }
  }
}
