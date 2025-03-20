import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { CompanyRepository, UserRepository } from '@/repositories';
import { UserRoles } from '@/shared/enums';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';

@injectable()
export class SysAdminService {
  constructor(
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  public async getTotalOrganizations(): Promise<number> {
    const count = await this.companyRepository.count({});
    return count.count;
  }
  // Get total number of users
  public async getTotalUsers(): Promise<number> {
    const count = await this.userRepository.count({});
    return count.count;
  }

  public async getActiveUsers() {
    return await this.userRepository.getAllActiveUsers();
  }

  public async getActiveUserCount() {
    return await this.userRepository.countActiveUsers();
  }

  // Get total active subscriptions
  public async getTotalActiveSubscriptions(): Promise<number> {
    const count = await this.companyRepository.count({ subscription_status: 'active' });
    return count.count;
  }

  // Get total expired subscriptions
  public async getTotalExpiredSubscriptions(): Promise<number> {
    const count = await this.companyRepository.count({ subscription_status: 'expired' });
    return count.count;
  }

  // Get dashboard summary
  public async getDashboardSummary() {
    const totalOrganizations = await this.getTotalOrganizations();
    const totalUsers = await this.getTotalUsers();
    const totalActiveSubscriptions = await this.getTotalActiveSubscriptions();
    const totalExpiredSubscriptions = await this.getTotalExpiredSubscriptions();

    return {
      totalOrganizations,
      totalUsers,
      totalActiveSubscriptions,
      totalExpiredSubscriptions,
    };
  }

  public async getAllCompanies(filters: { status?: string; subscription_status?: string }, sortBy: string = 'created_at', order: 'asc' | 'desc' = 'desc') {
    return await this.companyRepository.getAllCompanies(filters, sortBy, order);
  }

  public async getCompanyDetails(companyId: string) {
    return await this.companyRepository.getById(companyId);
  }

  public async getAllActiveUsers() {
    return await this.userRepository.getAllActiveUsers();
  }

  public async updateCompanyStatus(companyId: string, subscription_status: 'active' | 'pending' | 'deactivated') {
    return await this.companyRepository.updateCompanyStatus(companyId, subscription_status);
  }

  public async subscribeCompany(companyId: string, expiryDate: Date) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: 'active', subscription_expiry_date: expiryDate });
  }

  public async cancelSubscription(companyId: string) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: 'expired' });
  }

  public async renewSubscription(companyId: string, expiryDate: Date) {
    return await this.companyRepository.update({ id: companyId }, { subscription_status: 'active', subscription_expiry_date: expiryDate });
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
}
