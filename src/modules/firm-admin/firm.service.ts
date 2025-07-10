import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { FRONTEND_URL, TEMP_PASSWORD_LENGTH } from '@/config/env';
import { CompanyRepository, UserRepository, UserCompanyRepository } from '@/repositories';
import { UserRoles } from '@/shared/enums';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';

@injectable()
export class FirmAdminService {
  constructor(
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(UserCompanyRepository) private userCompanyRepository: UserCompanyRepository,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hashSync(password, salt);
  }

  private async sendTemporaryPasswordEmail(email: string, name: string, temporaryPassword: string) {
    const loginLink = `${FRONTEND_URL}/login`;

    await sendEmail(
      email,
      'Your Pylott Account Credentials',
      `<html>
                <body>
                    <h2>Welcome to Pylott, ${name}!</h2>
                    <p>An admin has created an account for you with the following credentials:</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                    <p>Please <a href="${loginLink}">login here</a> and change your password immediately for security.</p>
                    <p>If you didn't request this account, please contact your administrator.</p>
                    <p>Best regards,<br/>The Pylott Team</p>
                </body>
            </html>`,
    );
  }

  public async addUser(name: string, email: string, role: UserRoles, companyId: string) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ email });
    if (existingUser) {
      // Check if user is already in this company
      const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, companyId);
      if (isUserInCompany) {
        throw new HttpError('User is already a member of this company', 400);
      }
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(TEMP_PASSWORD_LENGTH).toString('hex').slice(0, TEMP_PASSWORD_LENGTH);

    // Hash the password before storing
    const hashedPassword = await this.hashPassword(temporaryPassword);

    // Create the user
    const user = await this.userRepository.create({
      name,
      email,
      role,
      password: hashedPassword,
      is_active: true,
      is_verified: true, // Mark as verified since admin created it
    });

    // Add user to the company using the new user_companies table
    await this.userCompanyRepository.addUserToCompany(user.id, companyId, role);

    // For backward compatibility, set the primary company_id
    await this.userRepository.update({ id: user.id }, { company_id: companyId });

    // Send email with temporary password
    await this.sendTemporaryPasswordEmail(email, name, temporaryPassword);

    return {
      ...user,
      password: undefined, // Don't return the password hash
    };
  }
}
