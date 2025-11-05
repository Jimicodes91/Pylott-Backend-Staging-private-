import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { RedisClientType } from 'redis';

import { ClientRepository, CompanyRepository, ConsultantRepository, ProjectMembersRepository, UserRepository, UserCompanyRepository, InvitationRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { generateOTP, strongPassword } from '@/shared/utils/any';
import { AUDIT_TRAIL_ACTION, RedisPrefixKeyEnum, UserRoles } from '@/shared/enums';
import { AdminSignupData, CompanyAdminSignpData, loginData } from '@/shared/interface/user';
import { generateToken } from '@/shared/utils/jwt';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET_KEY, FRONTEND_URL, PASSWORD_RESET_TOKEN_LENGTH, TEMP_PASSWORD_LENGTH, TOKEN_EXPIRATION_MS } from '@/config/env';
import { GoogleAuthData } from '@/shared/types/google.type';
import { StatusCodes } from 'http-status-codes';
import { Redis } from '@/shared/utils/redis/redis';
import { AddContactDto } from '@/modules/contact/contact.dto';
import { ContactRespository } from '@/repositories/contact.repository';
import { authEmailTemplate, otpEmailTemplate } from '../../../shared/utils/email';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars

@injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private FRONTEND_URL = FRONTEND_URL;
  private readonly redis: RedisClientType;

  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(ClientRepository) private clientRepository: ClientRepository,
    @inject(ConsultantRepository) private consultantRepository: ConsultantRepository,
    @inject(ContactRespository) private contactRepository: ContactRespository,
    @inject(UserCompanyRepository) private userCompanyRepository: UserCompanyRepository,
    @inject(InvitationRepository) private invitationRepository: InvitationRepository,
    private readonly projectMemberRepository: ProjectMembersRepository,
    private readonly auditTrailService: AuditTrailService,
    _redis: Redis,
  ) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${this.FRONTEND_URL}/auth/google/callback`);
    this.redis = _redis.getInstance();
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

  private async sendEmailTemplate(email: string, subject: string, title: string, content: string, actionLink: string, actionText: string, name: string, otp?: string) {
    await sendEmail(
      email,
      subject,
      authEmailTemplate({
        userName: name,
        mainTitle: title,
        message: content,
        actionText,
        actionLink,
        otp,
        // You can add more params if needed
      }),
    );
  }

  private async sendVerificationEmail(email: string, otp: string, name: string) {
    await sendEmail(
      email,
      'Pylott Email Verification',
      otpEmailTemplate({
        userName: name,
        otp: otp,
        mainTitle: 'Pylott Email Verification',
        message: 'Please use the verification code below to complete your email verification.',
        expiryMinutes: 10,
        supportEmail: 'ava@pylott.io',
        websiteLink: this.FRONTEND_URL,
        logoUrl: 'https://www.pylott.io/assets/logo-DabAzhJ7.svg',
        companyName: 'Pylott Team',
        copyright: 'Copyright © 2025 Pylott Technologies, All rights reserved.',
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendPasswordResetEmail(email: string, token: string, name: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resetLink = `${this.FRONTEND_URL}/reset-password?token=${email}`;
    await this.sendEmailTemplate(email, 'Password Reset Request', 'Reset Your Password', 'You requested to reset your password. Click the button below to proceed:', resetLink, 'Reset Password', name);
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
      const { email, password, name } = data;

      if (!email || !password || !name) {
        throw new HttpError('Email, name and password are required', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        return {
          status: false,
          message: 'Email is already registered',
          statusCode: StatusCodes.CONFLICT,
        };
      }

      await this.validatePasswordStrength(password);

      const otp = generateOTP();
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        email,
        name,
        password: hashedPassword,
        otp: otp,
        otp_expires: Date.now() + TOKEN_EXPIRATION_MS,
        role: UserRoles.ADMIN,
      });
      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      await this.sendVerificationEmail(email, otp, newUser.name);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return userResponse;
    } catch (error) {
      throw new HttpError(error.message || 'Error: Something went wrong, failed to complete action', 500);
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

      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        otp: otp,
        otp_expires: otpExpires,
        role: UserRoles.ADMIN,
      });

      await this.sendVerificationEmail(email, otp, newUser.name);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = newUser;
      return userResponse;
    } catch (error) {
      throw new HttpError(error.message || 'Error: something went wrong, failed to complete action', 500);
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

        throw new HttpError('You are not verified, please check your email for verification link.', 403);
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);
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

      // Get all companies the user belongs to
      const userCompanies = await this.userCompanyRepository.getUserCompanies(user.id);

      // Format companies list
      const companiesList = userCompanies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        role: uc.role,
        joined_at: uc.joined_at,
        is_active: uc.is_active,
      }));

      // Sort companies so the last viewed/switched company appears first
      // The last viewed company is stored in user.company_id
      if (user.company_id && companiesList.length > 1) {
        const lastViewedIndex = companiesList.findIndex((c) => c.id === user.company_id);
        if (lastViewedIndex > 0) {
          // Move last viewed company to the front
          const lastViewedCompany = companiesList.splice(lastViewedIndex, 1)[0];
          companiesList.unshift(lastViewedCompany);
        }
      }

      // Log user login activity
      this.auditTrailService.createEvent(AUDIT_TRAIL_ACTION.USER_LOGIN, {
        user_id: user.id,
        company_id: user.company_id || '',
        description: 'User logged in',
        entity_description: `${user.name} logged in`,
        entity_id: user.id,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = user;
      return {
        user: {
          ...userData,
          companies: companiesList,
        },
        token: accessToken,
      };
    } catch (error) {
      throw new HttpError(error.message || 'Error, Something went wrong, failed to login user', 500);
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

  public async verifyEmail(otp: string) {
    try {
      const user = await this.userRepository.findOne({ otp: otp });

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
          otp: null,
          token_expires: null,
        },
      );

      // Log email verification activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_EMAIL_VERIFIED,
        {
          user_id: user.id,
          company_id: user.company_id,
          description: 'Email verified',
          entity_description: `${user.name} verified their email`,
          entity_id: user.id,
        },
        '123',
      );

      const bearerToken = generateToken(user.email, user.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = user;
      return { user: userData, token: bearerToken };
    } catch (error) {
      throw new HttpError(error.message || 'Token verification error', 500);
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

      const otp = generateOTP();
      await this.userRepository.update(
        { id: user.id },
        {
          otp: otp,
          otp_expires: Date.now() + TOKEN_EXPIRATION_MS,
        },
      );

      await this.sendVerificationEmail(email, otp, user.name);
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      throw new HttpError(error.message || 'Error failure in sending Verification message', 500);
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

      await this.sendPasswordResetEmail(email, passwordResetToken, user.name);
      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to send password reset email', 500);
    }
  }

  public async resetPassword(token: string, newPassword: string) {
    try {
      const user = await this.userRepository.findOne({ email: token }); //leave as it is
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

  public async sendInvitation(adminId: string, email: string, role: UserRoles) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin || admin.role !== UserRoles.ADMIN) {
        throw new HttpError('Only company admins can send invitations', 403);
      }

      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      const existingUser = await this.userRepository.findByEmail(email);

      // If user already exists, check if they're already in this company
      if (existingUser) {
        const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, admin.company_id);
        if (isUserInCompany) {
          throw new HttpError('User is already a member of this company', 400);
        }
        // If user exists but not in this company, they should use inviteExistingUser endpoint
        // However, we'll still allow invitation for new user registration flow
        // The completeRegistration will handle both new and existing users
      }

      // Check if there's already a pending invitation for this email/company
      const existingInvitation = await this.invitationRepository.findByEmailAndCompany(email, admin.company_id);
      if (existingInvitation) {
        throw new HttpError('An invitation has already been sent to this email for this company', 400);
      }

      const company = await this.companyRepository.getCompanyNameById(admin.company_id);
      const companyName = company.name;

      const invitationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = Date.now() + TOKEN_EXPIRATION_MS; // 24 hours
      const registrationLink = `${this.FRONTEND_URL}/complete-invite?token=${invitationToken}`;

      // Store invitation data in invitations table
      const invitation = await this.invitationRepository.create({
        email: email,
        role: role,
        company_id: admin.company_id,
        invited_by: adminId,
        invitation_token: invitationToken,
        token_expires: tokenExpires,
        status: 'PENDING',
      });

      await this.sendEmailTemplate(
        email,
        `Welcome to Pylott`,
        `Invitation to join ${companyName}`,
        `You have been invited to join ${companyName} as a ${role}. Click the button below to complete your registration:`,
        registrationLink,
        'Complete Registration',
        `Pylott ${role}`,
      );

      // Log invitation sent activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
        {
          user_id: adminId,
          company_id: admin.company_id,
          description: 'User invitation sent',
          entity_description: `${admin.name} sent invitation to ${email} as ${role}`,
          entity_id: adminId,
        },
        adminId, // Use actual admin ID instead of hardcoded '123'
      );

      return { message: 'Invitation sent successfully', invitationId: invitation.id };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to send invitation', 500);
    }
  }

  public async completeRegistration(token: string, password: string, name: string) {
    try {
      // Find the invitation by token
      const invitation = await this.invitationRepository.findByToken(token);
      if (!invitation) {
        throw new HttpError('Invalid or expired invitation token', 400);
      }

      // Check if invitation is expired
      if (invitation.token_expires < Date.now()) {
        await this.invitationRepository.markAsExpired(invitation.id);
        throw new HttpError('Invitation has expired', 400);
      }

      // Check if invitation is already accepted
      if (invitation.status !== 'PENDING') {
        throw new HttpError('Invitation has already been used', 400);
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ email: invitation.email });

      let userToProcess;

      if (existingUser) {
        // User already exists - check if already in this company
        const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, invitation.company_id);
        if (isUserInCompany) {
          throw new HttpError('User is already a member of this company', 400);
        }

        // Update password if provided
        if (password) {
          await this.validatePasswordStrength(password);
          const hashedPassword = await this.hashPassword(password);
          await this.userRepository.update({ id: existingUser.id }, { password: hashedPassword });
        }

        // Update name if provided
        if (name && name !== existingUser.name) {
          await this.userRepository.update({ id: existingUser.id }, { name });
        }

        userToProcess = await this.userRepository.getById(existingUser.id);
      } else {
        // New user - create account
        if (!password) {
          throw new HttpError('Password is required for new user registration', 400);
        }

        await this.validatePasswordStrength(password);
        const hashedPassword = await this.hashPassword(password);

        // Create the user
        userToProcess = await this.userRepository.create({
          name: name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
          is_verified: true,
          company_id: invitation.company_id,
        });

        if (!userToProcess) {
          throw new HttpError('Error creating user', 400);
        }
      }

      // Add user to the company using the new user_companies table
      await this.userCompanyRepository.addUserToCompany(userToProcess.id, invitation.company_id, invitation.role, invitation.invited_by);

      // Create role-specific records for backward compatibility (only for new users)
      if (!existingUser) {
        try {
          if (invitation.role === UserRoles.CLIENT) {
            await this.clientRepository.create({
              user_id: userToProcess.id,
              company_id: invitation.company_id,
              is_active: true,
            });

            // Add client to company contacts
            const contactData = {
              name: userToProcess.name || name,
              email: invitation.email,
              phone: userToProcess.phone_number || '',
              company_id: invitation.company_id,
              assigned_to: [], // Empty array or default assignments
            };

            await this.contactRepository.create(contactData);

            const isProjectClient = await this.redis.get(`${RedisPrefixKeyEnum.PROJECT_CLIENT_INVITATION}:${invitation.email}`);

            const parsedCache = JSON.parse((isProjectClient as string) || '{}');

            if (Object.keys(parsedCache).length) {
              await this.projectMemberRepository.create({ ...parsedCache, user_id: userToProcess.id });
            }
          } else if (invitation.role === UserRoles.CONSULTANT) {
            await this.consultantRepository.create({
              user_id: userToProcess.id,
              company_id: invitation.company_id,
            });
          } else if (invitation.role === UserRoles.ADMIN) {
            await this.companyRepository.update({ id: invitation.company_id }, { admin_id: userToProcess.id });
          }
        } catch (roleError) {
          console.error('Failed to create role-specific record:', roleError);
          // Don't throw error for existing users joining new companies
          if (!existingUser) {
            throw new HttpError('Failed to create role-specific profile', 500);
          }
        }
      }

      // Mark invitation as accepted
      await this.invitationRepository.markAsAccepted(invitation.id);

      // Log registration/acceptance activity
      this.auditTrailService.createEvent(
        existingUser ? AUDIT_TRAIL_ACTION.USER_ADDED_TO_COMPANY : AUDIT_TRAIL_ACTION.USER_REGISTRATION_COMPLETED,
        {
          user_id: userToProcess.id,
          company_id: invitation.company_id,
          description: existingUser ? 'User accepted invitation to join company' : 'User registration completed',
          entity_description: existingUser ? `${userToProcess.name} accepted invitation to join as ${invitation.role}` : `${userToProcess.name} completed registration as ${invitation.role}`,
          entity_id: userToProcess.id,
        },
        invitation.invited_by,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userResponse } = userToProcess;
      return userResponse;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to complete registration', error.statusCode || 500);
    }
  }
  public async addClient(name: string, email: string, companyId: string) {
    try {
      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        // Check if user is already in this company
        const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, companyId);
        if (isUserInCompany) {
          throw new HttpError('User is already a member of this company', 400);
        }
      }

      const temporaryPassword = crypto.randomBytes(32).toString('hex').slice(0, TEMP_PASSWORD_LENGTH);
      const hashedPassword = await this.hashPassword(temporaryPassword);

      const newUser = await this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: UserRoles.CLIENT,
        is_verified: true,
      });

      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      // Add user to the company using the new user_companies table
      await this.userCompanyRepository.addUserToCompany(newUser.id, companyId, UserRoles.CLIENT);

      // For backward compatibility, set the primary company_id
      await this.userRepository.update({ id: newUser.id }, { company_id: companyId });

      const client = await this.clientRepository.create({
        company_id: companyId,
        user_id: newUser.id,
        is_active: true,
      });

      if (!client) {
        throw new HttpError('Error creating client', 500);
      }

      await this.companyRepository.update({ id: companyId }, { client_id: newUser.id });

      // 6. Add client to company contacts
      const contactData: AddContactDto = {
        name,
        email,
        phone: newUser.phone_number || '',
        company_id: companyId,
        assigned_to: [], // Empty array or default assignments
      };

      await this.contactRepository.create(contactData);

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

      // Log password update activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_PASSWORD_UPDATE,
        {
          user_id: userId,
          company_id: user.company_id,
          description: 'Password updated',
          entity_description: `${user.name} updated their password`,
          entity_id: userId,
        },
        '123',
      );

      return { message: 'Password updated successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update password', 500);
    }
  }

  public async inviteExistingUser(adminId: string, email: string, role: UserRoles) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (!existingUser) {
        throw new HttpError('User not found with this email', 404);
      }

      // Check if user is already in this company
      const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, admin.company_id);
      if (isUserInCompany) {
        throw new HttpError('User is already a member of this company', 400);
      }

      // Add user to the company
      await this.userCompanyRepository.addUserToCompany(existingUser.id, admin.company_id, role, adminId);

      const company = await this.companyRepository.getCompanyNameById(admin.company_id);
      const companyName = company.name;

      // Send email notification to the user
      await this.sendEmailTemplate(
        email,
        `Welcome to ${companyName}`,
        `You've been added to ${companyName}`,
        `You have been added to ${companyName} as a ${role}. You can now access the company's projects and resources.`,
        `${this.FRONTEND_URL}/login`,
        'Login to Pylott',
        `Pylott ${role}`,
      );

      // Log invitation sent activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
        {
          user_id: adminId,
          company_id: admin.company_id,
          description: 'Existing user invited to company',
          entity_description: `${admin.name} invited ${existingUser.name} to ${companyName} as ${role}`,
          entity_id: existingUser.id,
        },
        '123',
      );

      return { message: 'User added to company successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to invite user to company', 500);
    }
  }

  public async switchOrganization(userId: string, companyId: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Verify user belongs to this company
      const isUserInCompany = await this.userCompanyRepository.isUserInCompany(userId, companyId);
      if (!isUserInCompany) {
        throw new HttpError('User does not belong to this organization', 403);
      }

      // Get user's role in this company
      const userRole = await this.userCompanyRepository.getUserRoleInCompany(userId, companyId);

      // Get company details
      const company = await this.companyRepository.getById(companyId);
      if (!company) {
        throw new HttpError('Company not found', 404);
      }

      // Update user's primary company_id to track last viewed company
      // This will be used on next login to show the last viewed company first
      await this.userRepository.update({ id: userId }, { company_id: companyId });

      // Get all companies the user belongs to
      const userCompanies = await this.userCompanyRepository.getUserCompanies(userId);

      // Format companies list
      const companiesList = userCompanies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        role: uc.role,
        joined_at: uc.joined_at,
        is_active: uc.is_active,
      }));

      // Sort companies so the currently switched company appears first
      if (companiesList.length > 1) {
        const currentCompanyIndex = companiesList.findIndex((c) => c.id === companyId);
        if (currentCompanyIndex > 0) {
          // Move current company to the front
          const currentCompany = companiesList.splice(currentCompanyIndex, 1)[0];
          companiesList.unshift(currentCompany);
        }
      }

      // Generate new token with updated company context
      const accessToken = jwt.sign({ userId: user.id, email: user.email, role: userRole || user.role, companyId: companyId }, JWT_SECRET_KEY, { expiresIn: '7d' });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = user;

      return {
        user: {
          ...userData,
          company_id: companyId,
          role: userRole || user.role,
          companies: companiesList,
          currentCompany: {
            id: company.id,
            name: company.name,
            role: userRole || user.role,
          },
        },
        token: accessToken,
      };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to switch organization', error.statusCode || 500);
    }
  }

  public async getCompanyUsersWithStatus(adminId: string, companyId: string) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin || admin.role !== UserRoles.ADMIN) {
        throw new HttpError('Only company admins can view users', 403);
      }

      // Verify admin belongs to the requested company
      const adminBelongsToOneCompany = await this.userCompanyRepository.isUserInCompany(adminId, companyId);
      if (!adminBelongsToOneCompany && admin.company_id !== companyId) {
        throw new HttpError('Admin does not belong to this company', 403);
      }

      // Get all active users in the company (onboarded users)
      const activeUsers = await this.userCompanyRepository.getCompanyUsers(companyId);

      // Get all pending invitations for the company (not yet onboarded)
      const pendingInvitations = await this.invitationRepository.getPendingInvitationsByCompany(companyId);

      // Get all disabled users (is_active = false in user_companies)
      const disabledUserCompanies = await this.userCompanyRepository.getDisabledCompanyUsers(companyId);

      // Format active users - fetch inviter details
      const activeUsersList = await Promise.all(
        activeUsers.map(async (uc: any) => {
          let inviterName = null;
          if (uc.invited_by) {
            const inviter = await this.userRepository.getById(uc.invited_by);
            inviterName = inviter?.name || null;
          }
          return {
            id: uc.user.id,
            email: uc.user.email,
            name: uc.user.name,
            role: uc.role,
            status: 'ACTIVE',
            invited_at: uc.joined_at,
            invited_by: uc.invited_by,
            inviter_name: inviterName,
            is_active: true,
            is_blocked: uc.user.is_blocked || false,
          };
        }),
      );

      // Format inactive users (pending invitations) - fetch inviter details
      const inactiveUsersList = await Promise.all(
        pendingInvitations.map(async (invitation: any) => {
          let inviterName = null;
          if (invitation.invited_by) {
            const inviter = await this.userRepository.getById(invitation.invited_by);
            inviterName = inviter?.name || null;
          }
          return {
            id: invitation.id,
            email: invitation.email,
            name: null, // Name not available until they complete registration
            role: invitation.role,
            status: 'INACTIVE',
            invited_at: invitation.created_at,
            invited_by: invitation.invited_by,
            inviter_name: inviterName,
            invitation_token: invitation.invitation_token,
            invitation_expires: invitation.token_expires,
            is_invitation_expired: invitation.token_expires < Date.now(),
          };
        }),
      );

      // Format disabled users - fetch inviter details
      const disabledUsersList = await Promise.all(
        disabledUserCompanies.map(async (uc: any) => {
          let inviterName = null;
          if (uc.invited_by) {
            const inviter = await this.userRepository.getById(uc.invited_by);
            inviterName = inviter?.name || null;
          }
          return {
            id: uc.user.id,
            email: uc.user.email,
            name: uc.user.name,
            role: uc.role,
            status: 'DISABLED',
            invited_at: uc.joined_at,
            invited_by: uc.invited_by,
            inviter_name: inviterName,
            is_active: false,
            is_blocked: uc.user.is_blocked || false,
          };
        }),
      );

      return {
        active: activeUsersList,
        inactive: inactiveUsersList,
        disabled: disabledUsersList,
        total: activeUsersList.length + inactiveUsersList.length + disabledUsersList.length,
      };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch company users', error.statusCode || 500);
    }
  }

  public async resendInvitation(adminId: string, invitationId: string) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin || admin.role !== UserRoles.ADMIN) {
        throw new HttpError('Only company admins can resend invitations', 403);
      }

      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      // Get the invitation
      const invitation = await this.invitationRepository.getById(invitationId);
      if (!invitation) {
        throw new HttpError('Invitation not found', 404);
      }

      // Verify invitation belongs to admin's company
      if (invitation.company_id !== admin.company_id) {
        throw new HttpError('Invitation does not belong to your company', 403);
      }

      // Check if invitation is already accepted
      if (invitation.status === 'ACCEPTED') {
        throw new HttpError('Cannot resend invitation that has already been accepted', 400);
      }

      // Check if user is already in the company
      const existingUser = await this.userRepository.findByEmail(invitation.email);
      if (existingUser) {
        const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, admin.company_id);
        if (isUserInCompany) {
          throw new HttpError('User is already a member of this company', 400);
        }
      }

      // Generate new invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = Date.now() + TOKEN_EXPIRATION_MS; // 24 hours
      const registrationLink = `${this.FRONTEND_URL}/complete-invite?token=${invitationToken}`;

      // Update invitation with new token
      await this.invitationRepository.update(
        { id: invitationId },
        {
          invitation_token: invitationToken,
          token_expires: tokenExpires,
          status: 'PENDING', // Reset to pending if it was expired
        },
      );

      const company = await this.companyRepository.getCompanyNameById(admin.company_id);
      const companyName = company.name;

      // Resend invitation email
      await this.sendEmailTemplate(
        invitation.email,
        `Welcome to Pylott`,
        `Invitation to join ${companyName}`,
        `You have been invited to join ${companyName} as a ${invitation.role}. Click the button below to complete your registration:`,
        registrationLink,
        'Complete Registration',
        `Pylott ${invitation.role}`,
      );

      // Log invitation resent activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
        {
          user_id: adminId,
          company_id: admin.company_id,
          description: 'Invitation resent',
          entity_description: `${admin.name} resent invitation to ${invitation.email} as ${invitation.role}`,
          entity_id: invitationId,
        },
        adminId,
      );

      return { message: 'Invitation resent successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to resend invitation', error.statusCode || 500);
    }
  }

  public async logout(userId: string) {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        throw new HttpError('User not found', 404);
      }

      // Log logout activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_LOGOUT,
        {
          user_id: userId,
          company_id: user.company_id,
          description: 'User logged out',
          entity_description: `${user.name} logged out`,
          entity_id: userId,
        },
        '123',
      );

      return { message: 'Logged out successfully' };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to logout', 500);
    }
  }
}
