import { UserRepository, UserCompanyRepository } from '@/repositories';
import { UserUpdateData } from '@/shared/interface/user';
import HttpError from '@/shared/utils/errorHandler';
import { inject, injectable } from 'tsyringe';
import { Cloudinary } from '@/shared/utils/cloud-storage/cloudinary';
import { AUDIT_TRAIL_ACTION, DocumentsDirectory, UserRoles } from '@/shared/enums';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

@injectable()
export class UserService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(UserCompanyRepository) private userCompanyRepository: UserCompanyRepository,
    @inject(Cloudinary) private cloudinary: Cloudinary,
    private readonly auditTrailService: AuditTrailService,
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

      // Log profile update activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_PROFILE_UPDATED,
        {
          user_id: userId,
          company_id: user.company_id,
          description: 'User profile updated',
          entity_description: `${user.name} updated their profile`,
          entity_id: userId,
        },
        '',
      );

      return user;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update profile', 500);
    }
  }

  public async addUserToCompany(userId: string, companyId: string, role: UserRoles, invitedBy?: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Check if user is already in this company
      const isUserInCompany = await this.userCompanyRepository.isUserInCompany(userId, companyId);
      if (isUserInCompany) {
        throw new HttpError('User is already a member of this company', 400);
      }

      // Add user to the company
      await this.userCompanyRepository.addUserToCompany(userId, companyId, role, invitedBy);

      // Log user added to company activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_ADDED_TO_COMPANY,
        {
          user_id: userId,
          company_id: companyId,
          description: 'User added to company',
          entity_description: `${user.name} was added to company as ${role}`,
          entity_id: userId,
        },
        '',
      );

      return { message: 'User added to company successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add user to company', 500);
    }
  }

  public async getUserCompanies(userId: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      const userCompanies = await this.userCompanyRepository.getUserCompanies(userId);
      return userCompanies;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch user companies', 500);
    }
  }

  public async removeUserFromCompany(userId: string, companyId: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Check if user is in this company
      const isUserInCompany = await this.userCompanyRepository.isUserInCompany(userId, companyId);
      if (!isUserInCompany) {
        throw new HttpError('User is not a member of this company', 400);
      }

      // Remove user from the company
      await this.userCompanyRepository.removeUserFromCompany(userId, companyId);

      // Log user removed from company activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_REMOVED_FROM_COMPANY,
        {
          user_id: userId,
          company_id: companyId,
          description: 'User removed from company',
          entity_description: `${user.name} was removed from company`,
          entity_id: userId,
        },
        '',
      );

      return { message: 'User removed from company successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to remove user from company', 500);
    }
  }
}
