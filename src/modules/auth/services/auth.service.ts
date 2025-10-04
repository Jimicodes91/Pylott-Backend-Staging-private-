import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { RedisClientType } from 'redis';

import { ClientRepository, CompanyRepository, ConsultantRepository, ProjectMembersRepository, UserRepository, UserCompanyRepository, InvitationRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { strongPassword } from '@/shared/utils/any';
import { AUDIT_TRAIL_ACTION, RedisPrefixKeyEnum, UserRoles } from '@/shared/enums';
import { AdminSignupData, CompanyAdminSignpData, loginData } from '@/shared/interface/user';
import { generateToken } from '@/shared/utils/jwt';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET_KEY, FRONTEND_URL, PASSWORD_RESET_TOKEN_LENGTH, TEMP_PASSWORD_LENGTH, TOKEN_EXPIRATION_MS } from '@/config/env';
import { GoogleAuthData } from '@/shared/types/google.type';
import { StatusCodes } from 'http-status-codes';
import { Redis } from '@/shared/utils/redis/redis';
import { AddContactDto } from '@/modules/contact/contact.dto';
import { ContactRespository } from '@/repositories/contact.repository';
import { authEmailTemplate } from '../../../shared/utils/email';
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

  private async sendEmailTemplate(email: string, subject: string, title: string, content: string, actionLink: string, actionText: string, name: string) {
    await sendEmail(
      email,
      subject,
      authEmailTemplate({
        userName: name,
        mainTitle: title,
        message: content,
        actionText,
        actionLink,
        // You can add more params if needed
      }),
    );
  }

  private async sendVerificationEmail(email: string, token: string, name: string) {
    const verificationLink = `${this.FRONTEND_URL}/verify-account?token=${token}`;
    await this.sendEmailTemplate(email, 'Pylott Email Verification', 'Welcome to Pylott', 'Please verify your email by clicking the button below:', verificationLink, 'Verify Email', name);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendPasswordResetEmail(email: string, token: string, name: string) {
    console.log(token);
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

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        email,
        name,
        password: hashedPassword,
        verification_token: verificationToken,
        token_expires: Date.now() + TOKEN_EXPIRATION_MS,
        role: UserRoles.ADMIN,
      });
      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      await this.sendVerificationEmail(email, verificationToken, newUser.name);
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

      await this.sendVerificationEmail(email, verificationToken, newUser.name);
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

        throw new HttpError('Verify your email first. A new link has been sent.', 403);
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
          companies: userCompanies.map((uc) => ({
            id: uc.company.id,
            name: uc.company.name,
            role: uc.role,
            joined_at: uc.joined_at,
            is_active: uc.is_active,
          })),
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

      const verificationToken = crypto.randomBytes(32).toString('hex');
      await this.userRepository.update(
        { id: user.id },
        {
          verification_token: verificationToken,
          token_expires: Date.now() + TOKEN_EXPIRATION_MS,
        },
      );

      await this.sendVerificationEmail(email, verificationToken, user.name);
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

      // Check if user exists and is already in this company
      if (existingUser) {
        throw new HttpError('Email already used by another user, please use a different email', 400);

        // const isUserInCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, admin.company_id);
        // if (isUserInCompany) {
        //   throw new HttpError('User is already a member of this company', 400);
        // }
        // // Check if the user is in any other company
        // const isUserInAnyCompany = await this.userCompanyRepository.isUserInAnyCompany(existingUser.id);
        // if (isUserInAnyCompany) {
        //   throw new HttpError('User is already a member of another company', 400);
        // }
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
      await this.invitationRepository.create({
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

      return { message: 'Invitation sent successfully' };
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
      if (existingUser) {
        throw new HttpError('User with this email already exists', 400);
      }

      await this.validatePasswordStrength(password);
      const hashedPassword = await this.hashPassword(password);

      // Create the user
      const newUser = await this.userRepository.create({
        name: name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        is_verified: true,
        company_id: invitation.company_id,
      });

      if (!newUser) {
        throw new HttpError('Error creating user', 400);
      }

      // Add user to the company using the new user_companies table
      await this.userCompanyRepository.addUserToCompany(newUser.id, invitation.company_id, invitation.role, invitation.invited_by);

      // Create role-specific records for backward compatibility
      try {
        if (invitation.role === UserRoles.CLIENT) {
          await this.clientRepository.create({
            user_id: newUser.id,
            company_id: invitation.company_id,
            is_active: true,
          });

          // Add client to company contacts
          const contactData = {
            name,
            email: invitation.email,
            phone: newUser.phone_number || '',
            company_id: invitation.company_id,
            assigned_to: [], // Empty array or default assignments
          };

          await this.contactRepository.create(contactData);

          const isProjectClient = await this.redis.get(`${RedisPrefixKeyEnum.PROJECT_CLIENT_INVITATION}:${invitation.email}`);

          const parsedCache = JSON.parse((isProjectClient as string) || '{}');

          if (Object.keys(parsedCache).length) {
            await this.projectMemberRepository.create({ ...parsedCache, user_id: newUser.id });
          }
        } else if (invitation.role === UserRoles.CONSULTANT) {
          await this.consultantRepository.create({
            user_id: newUser.id,
            company_id: invitation.company_id,
          });
        } else if (invitation.role === UserRoles.ADMIN) {
          await this.companyRepository.update({ id: invitation.company_id }, { admin_id: newUser.id });
        }
      } catch (roleError) {
        console.error('Failed to create role-specific record:', roleError);
        throw new HttpError('Failed to create role-specific profile', 500);
      }

      // Mark invitation as accepted
      await this.invitationRepository.markAsAccepted(invitation.id);

      // Log registration completed activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_REGISTRATION_COMPLETED,
        {
          user_id: newUser.id,
          company_id: invitation.company_id,
          description: 'User registration completed',
          entity_description: `${newUser.name} completed registration as ${invitation.role}`,
          entity_id: newUser.id,
        },
        invitation.invited_by, // Use actual inviter ID instead of hardcoded '123'
      );

      return newUser;
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
