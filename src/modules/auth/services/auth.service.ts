import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { ClientRepository, CompanyRepository, ConsultantRepository, UserRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { strongPassword } from '@/shared/utils/any';
import { UserRoles } from '@/shared/enums';
import { AdminSignupData, CompanyAdminSignpData, loginData } from '@/shared/interface/user';
import { generateToken } from '@/shared/utils/jwt';

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(ClientRepository) private clientRepository: ClientRepository,
    @inject(ConsultantRepository) private consultantRepository: ConsultantRepository,
  ) {}
  public async adminSignup(data: AdminSignupData) {
    const { email, password } = data;
    if (!email || !password) {
      throw new HttpError('Please fill all the required fields', 400);
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes

    const userData = {
      email,
      password,
      verification_token: verificationToken,
      token_expires: tokenExpires,
      role: UserRoles.SUPER_ADMIN,
    };

    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is taken, use a different email address', 400);
      }

      if (!strongPassword(password)) {
        throw new HttpError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character', 400);
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = bcrypt.hashSync(password, salt);
      }

      const newUser = await this.userRepository.create(userData);

      const userResponse = { ...newUser };
      if (userResponse.password) {
        userResponse.password = '';
      }

      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      await sendEmail(
        newUser.email,
        'Pylott email verification',
        `<html>
			  <body>
				  <h2>Welcome to Pylott</h2>
				  <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
				  <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
				  <p>Best regards,</p>
				  <p>Pylott</p>
			  </body>
			</html>`,
      );

      return userResponse;
    } catch (error: any) {
      console.log(error);
      throw new HttpError(error.message || 'Unable to create user', error.statusCode || 500);
    }
  }

  public async companyAdminSignup(data: CompanyAdminSignpData) {
    const { email, password, name } = data;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes

    const userData = {
      name,
      email,
      password,
      verification_token: verificationToken,
      token_expires: tokenExpires,
      role: UserRoles.ADMIN,
    };

    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is taken, use a different email address', 400);
      }
      if (!strongPassword(password)) {
        throw new HttpError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character', 400);
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = bcrypt.hashSync(password, salt);
      }
      const newUser = await this.userRepository.create(userData);

      const userResponse = { ...newUser };
      if (userResponse.password) {
        userResponse.password = '';
      }

      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      await sendEmail(
        newUser.email,
        'Pylott email verification',
        `<html>
            <body>
                <h2>Welcome to Pylott</h2>
                <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
                <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
                <p>Best regards,</p>
                <p>Pylott</p>
            </body>
          </html>`,
      );

      return userResponse;
    } catch (error: any) {
      console.log(error);
      throw new HttpError(error.message || 'Unable to create user', error.statusCode || 500);
    }
  }

  public async signIn(data: loginData) {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    try {
      const user = await this.userRepository.findOne({ email: data.email });

      if (!user) {
        throw new HttpError('Invalid email or password', 401);
      }

      if (!user.is_verified) {
        const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(data.email)}`;

        await this.userRepository.update({ id: user.id }, { verification_token: verificationToken });

        await sendEmail(
          user.email,
          'Pylott email verification',
          `<html>
                <body>
                    <h2>Welcome to Pylott</h2>
                    <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
                    <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
                    <p>Best regards,</p>
                    <p>Pylott</p>
                </body>
              </html>`,
        );
        throw new HttpError('Verify email before log in, Verification link has been sent to your email', 404);
      }

      const password_valid = bcrypt.compareSync(data.password, user.password);

      if (!password_valid) {
        throw new HttpError('Invalid email or password', 401);
      }

      const token = jwt.sign({ email: user.email, role: user.role, _id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });

      return { user, token };
    } catch (error: any) {
      console.error('Error logging in user:', error);
      throw new HttpError(error.message || 'Unable to log in user', error.statusCode || 500);
    }
  }

  public async verifyEmail(token: string) {
    try {
      // Find the user by verification token
      const user = await this.userRepository.findOne({ verification_token: token });

      if (!user) {
        throw new HttpError('Invalid token', 400);
      }

      // Check if the token has expired
      if (user.token_expires && user.token_expires < Date.now()) {
        throw new HttpError('Token has expired', 400);
      }

      const bearerToken = generateToken(user.email, user.id);

      // Mark the user as verified and clear the verification token
      await this.userRepository.update(
        { id: user.id },
        {
          is_verified: true,
          verification_token: null,
          token_expires: null,
        },
      );

      return { user, token: bearerToken };
    } catch (error: any) {
      throw new HttpError(error.message || 'Email verification failed', 500);
    }
  }

  public async resendVerificationEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({ email });

      if (!user) {
        throw new HttpError('User not found', 404);
      }

      if (user.is_verified) {
        throw new HttpError('Email is already verified', 400);
      }

      // Generate a new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes

      await this.userRepository.update(
        { id: user.id },
        {
          verification_token: verificationToken,
          token_expires: tokenExpires,
        },
      );

      // Send new verification email
      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      await sendEmail(
        user.email,
        'Pylott Email Verification - Resend',
        `<html>
            <body>
                <h2>Email Verification</h2>
                <p>You requested a new verification email. Click the link below to verify your email:</p>
                <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
                <p>Best regards,</p>
                <p>Pylott</p>
            </body>
          </html>`,
      );

      return { message: 'Verification email sent successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to resend verification email', error.statusCode || 500);
    }
  }

  public async forgotPassword(email: string) {
    try {
      const user = await this.userRepository.findOne({ email });

      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Generate a password reset token
      const passwordResetToken = crypto.randomBytes(32).toString('hex');

      // Save the token to the user
      await this.userRepository.update({ id: user.id }, { verification_token: passwordResetToken });

      // Send the password reset email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${passwordResetToken}&email=${encodeURIComponent(email)}`;

      await sendEmail(
        user.email,
        'Reset Your Password',
        `<html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <a style="font-size: 20px;" href="${resetLink}">${resetLink}</a>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,</p>
                <p>Pylott</p>
            </body>
          </html>`,
      );

      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to send password reset email', 500);
    }
  }

  public async resetPassword(token: string, newPassword: string) {
    try {
      const user = await this.userRepository.findOne({ verification_token: token });

      if (!user) {
        throw new HttpError('Invalid or expired token', 400);
      }

      const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
      const strongPassword = passwordRegex.test(newPassword);
      if (!strongPassword) {
        throw new HttpError('Password must be 8+ chars with uppercase, lowercase, number, and special character', 400);
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);

      // Update user with new password and clear reset token
      await this.userRepository.update(
        { id: user.id },
        {
          password: hashedPassword,
          verification_token: null,
        },
      );

      return { message: 'Password has been reset successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to reset password', error.statusCode || 500);
    }
  }

  public async sendConsultantInvitation(adminId: string, email: string, role: UserRoles) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin || admin.role !== UserRoles.ADMIN) {
        throw new HttpError('Only company admins can send invitations', 403);
      }
      console.log(admin);

      // Ensure the admin is associated with a company
      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already registered', 400);
      }

      const invitationToken = crypto.randomBytes(32).toString('hex');

      const registrationLink = `${process.env.FRONTEND_URL}/register?token=${invitationToken}&email=${encodeURIComponent(email)}&role=${role}&company=${admin.company_id}`;

      await sendEmail(
        email,
        "You've Been Invited to Join Pylott",
        `<html>
			<body>
				<h2>Welcome to Pylott</h2>
				<p>You have been invited to join Pylott as a ${role}. Click the link below to complete your registration:</p>
				<a style="font-size: 20px;" href="${registrationLink}">Complete Registration</a>
				<p>Best regards,</p>
				<p>Pylott</p>
			</body>
		  </html>`,
      );

      return { message: 'Invitation sent successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to send invitation', 500);
    }
  }

  public async completeRegistration(email: string, password: string, companyId: string) {
    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already registered', 400);
      }

      if (!strongPassword(password)) {
        throw new HttpError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUser = await this.userRepository.create({
        email,
        password: hashedPassword,
        company_id: companyId,
        role: UserRoles.CONSULTANT,
        is_verified: true,
      });

      await this.companyRepository.pushToArray(
        { id: companyId }, // query_identifier
        'consultant_id', // column
        newUser.id, // value
      );

      await this.consultantRepository.create({
        user_id: newUser.id,
        company_id: companyId,
      });

      newUser.password = '';
      return newUser;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to complete registration', 500);
    }
  }

  public async addClient(name: string, email: string, companyId: string) {
    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already registered', 400);
      }

      const temporaryPassword = crypto.randomBytes(5).toString('hex').slice(0, 9);
      //console.log('temp', temporaryPassword);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = bcrypt.hashSync(temporaryPassword, salt);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: UserRoles.CLIENT,
        company_id: companyId,
        is_verified: true, // Mark as verified since they were added by the admin
      });
      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      const client = await this.clientRepository.create({
        company_id: companyId,
        user_id: newUser._id,
        is_active: true,
      });

      if (!client) {
        throw new HttpError('Error creating client', 500);
      }

      await this.companyRepository.update(
        { id: companyId }, // query_identifier
        { client_id: newUser._id }, // payload
      );

      await sendEmail(
        email,
        'Welcome to Pylott - Your Temporary Password',
        `<html>
			<body>
				<h2>Welcome to Pylott</h2>
				<p>You have been added as a client. Use the temporary password below to log in:</p>
				<p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
				<p>Please log in and update your password for security.</p>
				<p>Best regards,</p>
				<p>Pylott</p>
			</body>
		  </html>`,
      );

      return { message: 'Client added successfully. Temporary password sent via email.' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add client', 500);
    }
  }

  public async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new HttpError('Current password is incorrect', 400);
      }

      if (!strongPassword(newPassword)) {
        throw new HttpError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character', 400);
      }

      const salt = await bcrypt.genSalt(10);
      user.password = bcrypt.hashSync(newPassword, salt);

      await this.userRepository.update({ id: userId }, { password: user.password });

      return { message: 'Password updated successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update password', 500);
    }
  }
}
