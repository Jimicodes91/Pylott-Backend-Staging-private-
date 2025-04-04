import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import { ClientRepository, CompanyRepository, ConsultantRepository, UserRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { strongPassword } from '@/shared/utils/any';
import { UserRoles } from '@/shared/enums';
import { AdminSignupData, CompanyAdminSignpData, loginData } from '@/shared/interface/user';
import { generateToken } from '@/shared/utils/jwt';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET_KEY, PASSWORD_RESET_TOKEN_LENGTH, TEMP_PASSWORD_LENGTH, TOKEN_EXPIRATION_MS } from '@/config/env';
import { GoogleAuthData } from '@/shared/types/google.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars

@injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private FRONTEND_URL = 'https://silly-choux-da3934.netlify.app';
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(ClientRepository) private clientRepository: ClientRepository,
    @inject(ConsultantRepository) private consultantRepository: ConsultantRepository,
  ) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${this.FRONTEND_URL}/auth/google/callback`);
  }

  // Generate Google OAuth URL for client-side redirection
  public generateGoogleAuthURL(): string {
    return this.googleClient.generateAuthUrl({
      access_type: 'online',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      prompt: 'consent',
    });
  }
  public async verifyGoogleToken(code: string): Promise<GoogleAuthData> {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.googleClient.getToken(code);

      // Verify the ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      // Extract user information
      const payload = ticket.getPayload();
      if (!payload) {
        throw new HttpError('Invalid Google authentication payload', 400);
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        profilePicture: payload.picture,
      };
    } catch (error) {
      throw new HttpError(`Google authentication failed: ${error.message}`, 401);
    }
  }
  public async handleGoogleAuth(googleAuthData: GoogleAuthData) {
    try {
      // Check if user already exists
      let user = await this.userRepository.findOne({
        email: googleAuthData.email,
      });

      // If user doesn't exist, create a new user
      if (!user) {
        user = await this.userRepository.create({
          email: googleAuthData.email,
          name: googleAuthData.name,
          googleId: googleAuthData.googleId,
          role: UserRoles.CLIENT, // Default role, adjust as needed
          is_verified: true, // Google users are considered verified
        });
      }

      // Generate JWT token for authentication
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET_KEY,
        { expiresIn: '7d' },
      );

      // Return user info and token
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = user;
      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      throw new HttpError(`Google authentication error: ${error.message}`, 500);
    }
  }

  private async sendEmailTemplate(email: string, subject: string, title: string, content: string, actionLink: string, actionText: string) {
    await sendEmail(
      email,
      subject,
      `<html>
        <body>
          <h2>${title}</h2>
          <p>${content}</p>
          <a style="font-size: 16px; color: #ffffff; background-color: #2563eb; 
             padding: 10px 15px; text-decoration: none; border-radius: 5px;" 
             href="${actionLink}">${actionText}</a>
          <p><small>This link expires in 15 minutes.</small></p>
          <p>Best regards,<br/>Pylott Team</p>
        </body>
      </html>`,
    );
  }

  private async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${this.FRONTEND_URL}/verify-account?token=${token}`;

    await this.sendEmailTemplate(email, 'Pylott Email Verification', 'Welcome to Pylott', 'Please verify your email by clicking the button below:', verificationLink, 'Verify Email');
  }
  private async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.FRONTEND_URL}/reset-password?token=${token}`;
    await this.sendEmailTemplate(email, 'Password Reset Request', 'Reset Your Password', 'You requested to reset your password. Click the button below to proceed:', resetLink, 'Reset Password');
  }

  private async sendTemporaryPasswordEmail(email: string, tempPassword: string) {
    await sendEmail(
      email,
      'Your Temporary Password',
      `<html>
        <body>
          <h2>Welcome to Pylott</h2>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>Please log in and change it immediately for security.</p>
          <p>Best regards,<br/>Pylott Team</p>
        </body>
      </html>`,
    );
  }

  private async validatePasswordStrength(password: string) {
    if (!strongPassword(password)) {
      throw new HttpError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hashSync(password, salt);
  }

  public async adminSignup(data: AdminSignupData) {
    try {
      const { email, password } = data;

      if (!email || !password) {
        throw new HttpError('Email and password are required', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already in use', 400);
      }

      await this.validatePasswordStrength(password);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        email,
        password: hashedPassword,
        verification_token: verificationToken,
        token_expires: Date.now() + TOKEN_EXPIRATION_MS,
        role: UserRoles.ADMIN,
      });

      await this.sendVerificationEmail(email, verificationToken);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return userResponse;
    } catch (error) {
      throw new HttpError(error.message || 'SIGNUP_ADMIN_ERROR', 500);
    }
  }

  public async companyAdminSignup(data: CompanyAdminSignpData) {
    try {
      const { email, password, name } = data;

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already in use', 400);
      }

      await this.validatePasswordStrength(password);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        verification_token: verificationToken,
        token_expires: Date.now() + TOKEN_EXPIRATION_MS,
        role: UserRoles.ADMIN,
      });

      await this.sendVerificationEmail(email, verificationToken);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return userResponse;
    } catch (error) {
      throw new HttpError(error.message || 'SIGNUP_COMPANY_ADMIN_ERROR', 500);
    }
  }

  public async signIn(data: loginData) {
    try {
      const user = await this.userRepository.findOne({ email: data.email });
      if (!user) {
        throw new HttpError('Invalid email or password', 401);
      }

      if (!user.is_verified) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await this.userRepository.update(
          { id: user.id },
          {
            verification_token: verificationToken,
            token_expires: Date.now() + TOKEN_EXPIRATION_MS,
          },
        );
        await this.sendVerificationEmail(user.email, verificationToken);
        throw new HttpError('Verify your email first. A new link has been sent.', 403);
      }

      const isPasswordValid = bcrypt.compareSync(data.password, user.password);
      if (!isPasswordValid) {
        throw new HttpError('Invalid email or password', 401);
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET_KEY,
        { expiresIn: '7d' }, // Short-lived access token (15 minutes)
      );

      // const refreshToken = jwt.sign(
      //   { userId: user.id },
      //   JWT_SECRET_KEY + user.password, // Changes when password changes
      //   { expiresIn: '7d' } // Long-lived refresh token (7 days)
      // );
      // await this.userRepository.update(
      //   { id: user.id },
      //   {
      //     refresh_token: refreshToken,
      //     last_login: new Date()
      //   }
      // );
      await this.userRepository.update(
        { id: user.id },
        {
          last_login: new Date(),
          login_count: (user.login_count || 0) + 1,
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = user;
      return {
        user: userData,
        token: accessToken,
      };
    } catch (error) {
      throw new HttpError(error.message || 'SIGNIN_ERROR', 500);
    }
  }

  public async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET_KEY) as { userId: string };
    const user = await this.userRepository.getById(decoded.userId);

    // Validate token matches stored token
    if (!user || user.refresh_token !== refreshToken) {
      throw new HttpError('Invalid refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET_KEY, { expiresIn: '15m' });

    return { accessToken: newAccessToken };
  }

  public async verifyEmail(token: string) {
    try {
      const user = await this.userRepository.findOne({ verification_token: token });
      if (!user) {
        throw new HttpError('Invalid or expired token', 400);
      }

      if (user.token_expires && user.token_expires < Date.now()) {
        throw new HttpError('Token has expired', 400);
      }

      await this.userRepository.update(
        { id: user.id },
        {
          is_verified: true,
          verification_token: null,
          token_expires: null,
        },
      );

      const bearerToken = generateToken(user.email, user.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = user;
      return { user: userData, token: bearerToken };
    } catch (error) {
      throw new HttpError(error.message || 'VERIFY_TOKEN_ERROR', 500);
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

      const verificationToken = crypto.randomBytes(32).toString('hex');
      await this.userRepository.update(
        { id: user.id },
        {
          verification_token: verificationToken,
          token_expires: Date.now() + TOKEN_EXPIRATION_MS,
        },
      );

      await this.sendVerificationEmail(email, verificationToken);
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      throw new HttpError(error.message || 'RESEND_EMAIL_ERROR', 500);
    }
  }

  public async forgotPassword(email: string) {
    try {
      const user = await this.userRepository.findOne({ email });
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      const passwordResetToken = crypto.randomBytes(PASSWORD_RESET_TOKEN_LENGTH).toString('hex');
      await this.userRepository.update({ id: user.id }, { verification_token: passwordResetToken });

      await this.sendPasswordResetEmail(email, passwordResetToken);
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

      await this.validatePasswordStrength(newPassword);
      const hashedPassword = await this.hashPassword(newPassword);

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

      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already registered', 400);
      }

      const invitationToken = crypto.randomBytes(32).toString('hex');
      const registrationLink = `${this.FRONTEND_URL}/register?token=${invitationToken}&email=${encodeURIComponent(email)}&role=${role}&company=${admin.company_id}`;

      await this.sendEmailTemplate(
        email,
        "You've Been Invited to Join Pylott",
        'Welcome to Pylott',
        `You have been invited to join Pylott as a ${role}. Click the button below to complete your registration:`,
        registrationLink,
        'Complete Registration',
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

      await this.validatePasswordStrength(password);
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        email,
        password: hashedPassword,
        company_id: companyId,
        role: UserRoles.CONSULTANT,
        is_verified: true,
      });

      await this.companyRepository.pushToArray({ id: companyId }, 'consultant_id', newUser.id);

      await this.consultantRepository.create({
        user_id: newUser.id,
        company_id: companyId,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return userResponse;
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

      const temporaryPassword = crypto.randomBytes(32).toString('hex').slice(0, TEMP_PASSWORD_LENGTH);
      const hashedPassword = await this.hashPassword(temporaryPassword);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: UserRoles.CLIENT,
        company_id: companyId,
        is_verified: true,
      });

      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      const client = await this.clientRepository.create({
        company_id: companyId,
        user_id: newUser.id,
        is_active: true,
      });

      if (!client) {
        throw new HttpError('Error creating client', 500);
      }

      await this.companyRepository.update({ id: companyId }, { client_id: newUser.id });

      await this.sendTemporaryPasswordEmail(email, temporaryPassword);
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
