import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { CompanyRepository, ProjectRepository, UserRepository } from '@/repositories';
import { UserRoles } from '@/shared/enums';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { SubscriptionStatus } from '@/shared/utils/subscription.type';
import { SubscriptionRepository } from '@/repositories/subscription.repository';
import { CompanyFilterOptions } from '@/shared/interface/company';

export interface UserFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

@injectable()
export class SysAdminService {
  constructor(
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(SubscriptionRepository) private subscriptionRepository: SubscriptionRepository,
    @inject(ProjectRepository) private projectRepository: ProjectRepository,
  ) {}

  public async getTotalOrganizations(): Promise<number> {
    const count = await this.companyRepository.count({});
    return count.count;
  }

  public async getTotalUserCount(): Promise<number> {
    const count = await this.userRepository.count({ is_active: true });
    return count.count;
  }

  public async getTotalUsers(filter: UserFilterOptions = {}): Promise<any> {
    try {
      const { page = 1, pageSize = 10, search } = filter;

      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.userRepository.getAllUsers(page, pageSize, search);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch users', error.statusCode || 500);
    }
  }

  public async getTotalProjects(): Promise<number> {
    const count = await this.projectRepository.count({});
    return count.count;
  }

  // public async getAllCompanyUsers(){
  //   const users = await this.userRepository.
  // }

  public async getActiveUsers() {
    return await this.userRepository.getAllActiveUsers();
  }

  public async getActiveUserCount() {
    return await this.userRepository.countActiveUsers();
  }

  // Get total active subscriptions
  // public async getTotalActiveSubscriptions(): Promise<number> {
  //   const count = await this.companyRepository.count({ subscription_status: SubscriptionStatus.ACTIVE });
  //   return count.count;
  // }

  public async getTotalActiveSubscriptions(): Promise<number> {
    const count = await this.subscriptionRepository.getTotalSubscriptions({ status: SubscriptionStatus.ACTIVE });
    return count;
  }

  // Get total expired subscriptions
  // public async getTotalExpiredSubscriptions(): Promise<number> {
  //   const count = await this.companyRepository.count({ subscription_status: SubscriptionStatus.EXPIRED });
  //   return count.count;
  // }

  // Get dashboard summary
  public async getDashboardSummary() {
    const totalOrganizations = await this.getTotalOrganizations();
    const totalUsers = await this.getTotalUserCount();
    const totalActiveSubscriptions = await this.getTotalActiveSubscriptions();
    const totalProjects = await this.getTotalProjects();

    return {
      totalOrganizations,
      totalUsers,
      totalActiveSubscriptions,
      totalProjects,
    };
  }

  public async getAllCompanies(filters: CompanyFilterOptions = {}) {
    try {
      return await this.companyRepository.getAllCompanies(filters);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch companies', error.statusCode || 500);
    }
  }

  public async getCompanyDetails(companyId: string) {
    return await this.companyRepository.getById(companyId);
  }

  public async getAllActiveUsers() {
    return await this.userRepository.getAllActiveUsers();
  }

  public async updateCompanyStatus(companyId: string, subscription_status: SubscriptionStatus) {
    return await this.companyRepository.updateCompanyStatus(companyId, subscription_status);
  }

  public async subscribeCompany(companyId: string, expiryDate: Date) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: SubscriptionStatus.ACTIVE, subscription_expiry_date: expiryDate });
  }

  public async cancelSubscription(companyId: string) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: SubscriptionStatus.CANCELLED });
  }

  public async renewSubscription(companyId: string, expiryDate: Date) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: SubscriptionStatus.ACTIVE, subscription_expiry_date: expiryDate });
  }

  public async addSysAdmin(name: string, email: string, role: UserRoles = UserRoles.SUPER_ADMIN) {
    try {
      if (!name || !email) {
        throw new HttpError('Please fill all the required fields', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already registered', 400);
      }

      const temporaryPassword = crypto.randomBytes(5).toString('hex').slice(0, 9);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = bcrypt.hashSync(temporaryPassword, salt);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        role,
        is_verified: true, // Mark as verified since they were added by an admin
        is_active: true,
      });

      if (!newUser) {
        throw new HttpError('Error creating SysAdmin user', 400);
      }

      // Send an email with the temporary password
      await sendEmail(
        email,
        'Welcome to Pylott - Your Temporary Password',
        `<html>
          <body>
            <h2>Welcome to Pylott</h2>
            <p>You have been added as a SysAdmin. Use the temporary password below to log in:</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            <p>Please log in and update your password for security.</p>
            <p>Best regards,</p>
            <p>Pylott</p>
          </body>
        </html>`,
      );

      return { message: 'SysAdmin added successfully. Temporary password sent via email.' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add SysAdmin', 500);
    }
  }

  public async deactivateSysAdmin(userId: string) {
    return this.userRepository.deactivateSysAdmin(userId);
  }

  public async getAllAdmins() {
    return this.userRepository.getAllAdmins();
  }

  // In admin.service.ts
  public async getCompanyUsers(companyId: string) {
    if (!companyId) {
      throw new HttpError('Company ID is required', 400);
    }

    return await this.userRepository.getUsersByCompany(companyId);
  }

  public async updateUserStatus(userid: string) {
    if (!userid) {
      throw new HttpError('User Id is required', 400);
    }

    const updatedUser = await this.userRepository.toggleUserStatus(userid);
    if (!updatedUser) {
      throw new HttpError('User not found', 404);
    }

    return updatedUser;
  }

  public async getTotalCompanies(filters?: { status?: string; subscription_status?: SubscriptionStatus }): Promise<number> {
    return this.companyRepository.getTotalCompanies(filters);
  }

  public async getTotalSubscriptions(filters?: { status?: SubscriptionStatus }): Promise<number> {
    return this.subscriptionRepository.getTotalSubscriptions(filters);
  }

  public async getAllSysAdmins() {
    return this.userRepository.getAllAdmins();
  }
}
