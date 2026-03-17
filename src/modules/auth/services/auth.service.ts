import bcrypt from 'bcryptjs';
import { inject, injectable } from 'tsyringe';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { RedisClientType } from 'redis';

import {
  ClientRepository,
  CompanyRepository,
  ConsultantRepository,
  ProjectMembersRepository,
  UserRepository,
  UserCompanyRepository,
  InvitationRepository,
  ProjectTypeRepository,
  MilestonesRepository,
  MetadataRepository,
  ClientInviteRequestRepository,
} from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';
import sendEmail from '@/shared/utils/nodemailer';
import { generateOTP, strongPassword } from '@/shared/utils/any';
import { AUDIT_TRAIL_ACTION, MetadataType, RedisPrefixKeyEnum, UserRoles } from '@/shared/enums';
import Objection from 'objection';
import { AdminSignupData, CompanyAdminSignpData, loginData, WorkspaceSignupData } from '@/shared/interface/user';
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
    @inject(ProjectTypeRepository) private projectTypeRepository: ProjectTypeRepository,
    @inject(MilestonesRepository) private milestonesRepository: MilestonesRepository,
    @inject(MetadataRepository) private metadataRepository: MetadataRepository,
    @inject(ClientInviteRequestRepository) private clientInviteRequestRepository: ClientInviteRequestRepository,
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

  private validateName(name: string) {
    if (!name || typeof name !== 'string') {
      throw new HttpError('Name is required and must be a string', 400);
    }
    // Check if name contains any numbers
    if (/\d/.test(name)) {
      throw new HttpError('Name cannot contain numbers', 400);
    }
    // Check if name contains only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      throw new HttpError('Name can only contain letters, spaces, hyphens, and apostrophes', 400);
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

      // this.validateName(name);

      const existingUser = await this.userRepository.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new HttpError('Email is already registered', StatusCodes.CONFLICT);
      }

      await this.validatePasswordStrength(password);

      const otp = generateOTP();
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        email,
        name: 'Admin',
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
      const { email, password } = data;

      if (!email || !password) {
        throw new HttpError('Email and password are required', 400);
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new HttpError('Email is already in use', 400);
      }

      await this.validatePasswordStrength(password);

      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      const hashedPassword = await this.hashPassword(password);

      const newUser = await this.userRepository.create({
        name: 'Admin',
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

  /**
   * Self-serve workspace signup: new user creates account with email + password,
   * a new workspace (company) is created, and the user becomes super_admin. No approval required.
   */
  public async workspaceSignup(data: WorkspaceSignupData) {
    const { email, password, name } = data;

    if (!email || !password || !name) {
      throw new HttpError('Email, password, and name are required', 400);
    }

    this.validateName(name);

    const existingUser = await this.userRepository.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new HttpError('Email is already registered', StatusCodes.CONFLICT);
    }

    await this.validatePasswordStrength(password);

    const hashedPassword = await this.hashPassword(password);

    const result = await Objection.Model.transaction(async (trx) => {
      const company = await this.companyRepository.create(
        {
          name: `${name.trim()}'s Workspace`,
          industry_type: 'General',
          size: '1-10',
          country: 'Not set',
          address: '',
          city: 'Not set',
          is_active: true,
        },
        trx,
      );

      const newUser = await this.userRepository.create(
        {
          email: email.toLowerCase(),
          name: name.trim(),
          password: hashedPassword,
          role: UserRoles.SUPER_ADMIN,
          company_id: company.id,
          is_verified: true,
          is_active: true,
        },
        trx,
      );

      await this.userCompanyRepository.create(
        {
          user_id: newUser.id,
          company_id: company.id,
          role: UserRoles.SUPER_ADMIN,
          is_active: true,
          invited_by: undefined,
          joined_at: new Date(),
        },
        trx,
      );

      await this.companyRepository.update({ id: company.id }, { admin_id: newUser.id }, trx);

      // Default journeys (project types) with milestones (Row 13: IFZA + Residency/Immigration)
      const defaultJourneys: Array<{ name: string; milestones: Array<{ name: string; duration: number }> }> = [
        {
          name: 'IFZA Incorporation Journey',
          milestones: [
            { name: 'Document Preparation', duration: 2 },
            { name: 'Submitted to Free Zone for Review', duration: 1 },
            { name: 'Know Your Client (KYC) Review', duration: 1 },
            { name: 'Summary Signing (authorization)', duration: 1 },
            { name: 'Resolution & MOA Authorization', duration: 1 },
            { name: 'License Issued', duration: 1 },
          ],
        },
        {
          name: 'Residency/Immigration Journey',
          milestones: [
            { name: 'Establishment Card Processing', duration: 2 },
            { name: 'Entry Permit Application', duration: 3 },
            { name: 'Medicals', duration: 1 },
            { name: 'Biometrics', duration: 1 },
            { name: 'Visa Issuance', duration: 2 },
            { name: 'Emirates ID', duration: 1 },
          ],
        },
      ];
      for (const journey of defaultJourneys) {
        const projectType = await this.projectTypeRepository.create({ company_id: company.id, name: journey.name, is_system: true }, trx);
        const typeId = typeof projectType === 'string' ? projectType : (projectType as { id?: string })?.id;
        if (!typeId) throw new Error('Failed to create default project type');
        for (let i = 0; i < journey.milestones.length; i++) {
          const m = journey.milestones[i];
          await this.milestonesRepository.create(
            {
              project_type_id: typeId,
              company_id: company.id,
              name: m.name,
              duration: m.duration,
              order: i + 1,
              is_system: true,
              completed_at: null,
            },
            trx,
          );
        }
      }

      // Default task types for onboarding (Document upload = upload field in task form per spec)
      const defaultTaskTypeNames = ['Document upload', 'General'];
      for (const taskTypeName of defaultTaskTypeNames) {
        await this.metadataRepository.create({ company_id: company.id, name: taskTypeName, type: MetadataType.TASK, description: '', is_system: true }, trx);
      }

      return { user: newUser, company };
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userResponse } = result.user;
    const token = generateToken(userResponse.email, userResponse.id);
    return { user: userResponse, token };
  }

  public async signIn(data: loginData) {
    try {
      const user = await this.userRepository.findOne({ email: data.email });
      if (!user) {
        throw new HttpError('Invalid email or password', 401);
      }
      if (user.password_setup_token && user.password_setup_token_expires && user.password_setup_token_expires > Date.now()) {
        throw new HttpError('Please set your password. Check your email for the link.', 403);
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

      // Get all companies the user belongs to (only active memberships)
      const userCompanies = await this.userCompanyRepository.getUserCompanies(user.id);

      // Format companies list
      let companiesList = userCompanies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        role: uc.role,
        joined_at: uc.joined_at,
        is_active: uc.is_active,
      }));

      // If companies list is empty but user has a company_id, add it only if still active in that company
      if (companiesList.length === 0 && user.company_id) {
        const uc = await this.userCompanyRepository.getUserCompany(user.id, user.company_id);
        if (uc?.is_active) {
          const company = await this.companyRepository.getById(user.company_id);
          if (company) {
            companiesList = [
              {
                id: company.id,
                name: company.name,
                role: user.role || UserRoles.CLIENT,
                joined_at: user.created_at || (new Date() as any),
                is_active: 1 as any,
              },
            ];
          }
        }
      }

      if (companiesList.length === 0) {
        throw new HttpError('Your account has been deactivated. Contact your administrator.', 403);
      }

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

      // Prevent admin from inviting their own email address
      if (admin.email.toLowerCase() === email.toLowerCase()) {
        throw new HttpError('You cannot invite your own email address', 400);
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

  /** Super Admin only: invite a new Admin to the workspace. */
  public async inviteAdmin(superAdminId: string, email: string) {
    const inviter = await this.userRepository.getById(superAdminId);
    if (!inviter || inviter.role !== UserRoles.SUPER_ADMIN) {
      throw new HttpError('Only Super Admin can invite Admins', 403);
    }
    if (!inviter.company_id) {
      throw new HttpError('Super Admin is not associated with a company', 400);
    }
    return this.createAndSendInvite(inviter, email, UserRoles.ADMIN);
  }

  /** Super Admin or Admin: invite a Consultant to the workspace. */
  public async inviteConsultant(inviterId: string, email: string) {
    const inviter = await this.userRepository.getById(inviterId);
    if (!inviter) {
      throw new HttpError('User not found', 404);
    }
    if (inviter.role !== UserRoles.SUPER_ADMIN && inviter.role !== UserRoles.ADMIN) {
      throw new HttpError('Only Super Admin or Admin can invite Consultants', 403);
    }
    if (!inviter.company_id) {
      throw new HttpError('You are not associated with a company', 400);
    }
    return this.createAndSendInvite(inviter, email, UserRoles.CONSULTANT);
  }

  private async createAndSendInvite(inviter: { id: string; name?: string; email: string; company_id?: string }, email: string, role: UserRoles) {
    if (!inviter.company_id) {
      throw new HttpError('Inviter is not associated with a company', 400);
    }
    const companyId = inviter.company_id;
    const normalizedEmail = email.toLowerCase();
    if (inviter.email.toLowerCase() === normalizedEmail) {
      throw new HttpError('You cannot invite your own email address', 400);
    }
    const existingInvitation = await this.invitationRepository.findByEmailAndCompany(normalizedEmail, companyId);
    if (existingInvitation) {
      throw new HttpError('An invitation has already been sent to this email for this company', 400);
    }
    const existingUser = await this.userRepository.findOne({ email: normalizedEmail });
    if (existingUser) {
      const inCompany = await this.userCompanyRepository.isUserInCompany(existingUser.id, companyId);
      if (inCompany) {
        throw new HttpError('User is already a member of this company', 400);
      }
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + TOKEN_EXPIRATION_MS;
    const registrationLink = `${this.FRONTEND_URL}/complete-invite?token=${invitationToken}`;
    const company = await this.companyRepository.getCompanyNameById(companyId);
    const companyName = company?.name || 'the company';

    const invitation = await this.invitationRepository.create({
      email: normalizedEmail,
      role,
      company_id: companyId,
      invited_by: inviter.id,
      invitation_token: invitationToken,
      token_expires: tokenExpires,
      status: 'PENDING',
    });

    await this.sendEmailTemplate(
      normalizedEmail,
      'Welcome to Pylott',
      `Invitation to join ${companyName}`,
      `You have been invited to join ${companyName} as an ${role}. Click the button below to complete your registration:`,
      registrationLink,
      'Complete Registration',
      inviter.name || role,
    );

    this.auditTrailService.createEvent(
      AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
      {
        user_id: inviter.id,
        company_id: companyId,
        description: 'Invitation sent',
        entity_description: `${inviter.name} invited ${normalizedEmail} as ${role}`,
        entity_id: invitation.id,
      },
      inviter.id,
    );

    return { message: 'Invitation sent successfully', invitationId: invitation.id };
  }

  /** Send client invite to a contact. (Requirement #5, #6.3, #6.4.) Super Admin can always send; Admin/Consultant need can_invite_clients. Consultant creates pending approval request; Admin/Super Admin with can_approve_client_invites can approve. */
  public async sendContactInvite(inviterUserId: string, contactId: string) {
    const inviter = await this.userRepository.getById(inviterUserId);
    if (!inviter) {
      throw new HttpError('User not found', 404);
    }
    if (inviter.role !== UserRoles.SUPER_ADMIN && inviter.role !== UserRoles.ADMIN && inviter.role !== UserRoles.CONSULTANT) {
      throw new HttpError('Only Super Admin, Admin or Consultant can send client invites', StatusCodes.FORBIDDEN);
    }
    if (!inviter.company_id) {
      throw new HttpError('You are not associated with a company', StatusCodes.BAD_REQUEST);
    }

    const membership = await this.userCompanyRepository.getUserCompany(inviterUserId, inviter.company_id);
    if (!membership) {
      throw new HttpError('You are not a member of this workspace', StatusCodes.FORBIDDEN);
    }

    const contact = await this.contactRepository.getContactById(contactId);
    if (!contact) {
      throw new HttpError('Contact not found', StatusCodes.NOT_FOUND);
    }
    if (contact.company_id !== inviter.company_id) {
      throw new HttpError('Contact does not belong to your workspace', StatusCodes.FORBIDDEN);
    }
    if (contact.status === 'Invited') {
      throw new HttpError('An invitation has already been sent to this contact', StatusCodes.BAD_REQUEST);
    }
    if (contact.status === 'Active') {
      throw new HttpError('Contact is already active (client has already joined)', StatusCodes.BAD_REQUEST);
    }

    const canInviteClients = inviter.role === UserRoles.SUPER_ADMIN || (membership as any).can_invite_clients === true;
    if (!canInviteClients) {
      throw new HttpError('You do not have permission to invite clients. Ask a Super Admin to grant you client invite rights.', StatusCodes.FORBIDDEN);
    }

    if (inviter.role === UserRoles.CONSULTANT) {
      const existing = await this.clientInviteRequestRepository.findPendingByContact(contactId);
      if (existing) {
        throw new HttpError('A client invite request for this contact is already pending approval', StatusCodes.BAD_REQUEST);
      }
      const requestId = uuidv4();
      await this.clientInviteRequestRepository.create({
        id: requestId,
        contact_id: contactId,
        company_id: inviter.company_id,
        requested_by_user_id: inviterUserId,
        status: 'pending',
      });
      return { message: 'Client invite request submitted for approval. An admin will review and send the invite.', contactId, requestId };
    }

    await this.createAndSendInvite(inviter, contact.email.toLowerCase(), UserRoles.CLIENT);
    await this.contactRepository.update({ id: contactId }, { status: 'Invited' as const });
    return { message: 'Invitation sent successfully. Contact status updated to Invited.', contactId };
  }

  /** List pending client invite requests (Super Admin or Admin with can_approve_client_invites). */
  public async getPendingClientInviteRequests(userId: string) {
    const user = await this.userRepository.getById(userId);
    if (!user?.company_id) {
      throw new HttpError('You are not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const membership = await this.userCompanyRepository.getUserCompany(userId, user.company_id);
    if (!membership) {
      throw new HttpError('You are not a member of this workspace', StatusCodes.FORBIDDEN);
    }
    const canApprove = user.role === UserRoles.SUPER_ADMIN || (membership as any).can_approve_client_invites === true;
    if (!canApprove) {
      throw new HttpError('You do not have permission to approve client invite requests', StatusCodes.FORBIDDEN);
    }
    const requests = await this.clientInviteRequestRepository.getPendingByCompany(user.company_id);
    return { data: requests };
  }

  /** Approve a client invite request: send the invite and set contact to Invited. (Super Admin or Admin with can_approve_client_invites.) */
  public async approveClientInviteRequest(approverUserId: string, requestId: string) {
    const approver = await this.userRepository.getById(approverUserId);
    if (!approver?.company_id) {
      throw new HttpError('You are not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const membership = await this.userCompanyRepository.getUserCompany(approverUserId, approver.company_id);
    if (!membership) {
      throw new HttpError('You are not a member of this workspace', StatusCodes.FORBIDDEN);
    }
    const canApprove = approver.role === UserRoles.SUPER_ADMIN || (membership as any).can_approve_client_invites === true;
    if (!canApprove) {
      throw new HttpError('You do not have permission to approve client invite requests', StatusCodes.FORBIDDEN);
    }

    const request = await this.clientInviteRequestRepository.findOne({ id: requestId, company_id: approver.company_id, deleted_at: null });
    if (!request) {
      throw new HttpError('Client invite request not found', StatusCodes.NOT_FOUND);
    }
    if ((request as any).status !== 'pending') {
      throw new HttpError('This request has already been processed', StatusCodes.BAD_REQUEST);
    }

    const contact = await this.contactRepository.getContactById((request as any).contact_id);
    if (!contact) {
      throw new HttpError('Contact not found', StatusCodes.NOT_FOUND);
    }
    if (contact.status !== 'Uninvited') {
      throw new HttpError('Contact is no longer in Uninvited status', StatusCodes.BAD_REQUEST);
    }

    const inviter = await this.userRepository.getById((request as any).requested_by_user_id);
    if (!inviter) {
      throw new HttpError('Requester not found', StatusCodes.NOT_FOUND);
    }
    await this.createAndSendInvite(inviter, contact.email.toLowerCase(), UserRoles.CLIENT);
    await this.contactRepository.update({ id: contact.id }, { status: 'Invited' as const });
    await this.clientInviteRequestRepository.update({ id: requestId }, { status: 'approved', approved_by_user_id: approverUserId, approved_at: new Date().toISOString() } as any);
    return { message: 'Client invite approved and invitation sent.', requestId, contactId: contact.id };
  }

  /** Reject a client invite request. */
  public async rejectClientInviteRequest(approverUserId: string, requestId: string) {
    const approver = await this.userRepository.getById(approverUserId);
    if (!approver?.company_id) {
      throw new HttpError('You are not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const membership = await this.userCompanyRepository.getUserCompany(approverUserId, approver.company_id);
    if (!membership) {
      throw new HttpError('You are not a member of this workspace', StatusCodes.FORBIDDEN);
    }
    const canApprove = approver.role === UserRoles.SUPER_ADMIN || (membership as any).can_approve_client_invites === true;
    if (!canApprove) {
      throw new HttpError('You do not have permission to reject client invite requests', StatusCodes.FORBIDDEN);
    }

    const request = await this.clientInviteRequestRepository.findOne({ id: requestId, company_id: approver.company_id, deleted_at: null });
    if (!request) {
      throw new HttpError('Client invite request not found', StatusCodes.NOT_FOUND);
    }
    if ((request as any).status !== 'pending') {
      throw new HttpError('This request has already been processed', StatusCodes.BAD_REQUEST);
    }

    await this.clientInviteRequestRepository.update({ id: requestId }, { status: 'rejected', approved_by_user_id: approverUserId, approved_at: new Date().toISOString() } as any);
    return { message: 'Client invite request rejected.', requestId };
  }

  /** Super Admin only: set can_invite_clients and/or can_approve_client_invites for a user in the workspace. */
  public async updateUserClientInvitePermissions(superAdminUserId: string, targetUserId: string, payload: { can_invite_clients?: boolean; can_approve_client_invites?: boolean }) {
    const superAdmin = await this.userRepository.getById(superAdminUserId);
    if (!superAdmin || superAdmin.role !== UserRoles.SUPER_ADMIN) {
      throw new HttpError('Only Super Admin can update client invite permissions', StatusCodes.FORBIDDEN);
    }
    if (!superAdmin.company_id) {
      throw new HttpError('Super Admin is not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const membership = await this.userCompanyRepository.getUserCompany(targetUserId, superAdmin.company_id);
    if (!membership) {
      throw new HttpError('Target user is not in this workspace', StatusCodes.NOT_FOUND);
    }
    const target = await this.userRepository.getById(targetUserId);
    if (!target) {
      throw new HttpError('Target user not found', StatusCodes.NOT_FOUND);
    }
    if (target.role !== UserRoles.ADMIN && target.role !== UserRoles.CONSULTANT) {
      throw new HttpError('Client invite permissions can only be set for Admin or Consultant', StatusCodes.BAD_REQUEST);
    }

    const update: any = {};
    if (payload.can_invite_clients !== undefined) update.can_invite_clients = payload.can_invite_clients;
    if (payload.can_approve_client_invites !== undefined) update.can_approve_client_invites = payload.can_approve_client_invites;
    if (Object.keys(update).length === 0) {
      throw new HttpError('Provide at least one of can_invite_clients or can_approve_client_invites', StatusCodes.BAD_REQUEST);
    }
    await this.userCompanyRepository.update({ user_id: targetUserId, company_id: superAdmin.company_id }, update);
    return { message: 'Permissions updated.', userId: targetUserId, ...update };
  }

  /** Super Admin only: deactivate an admin or consultant in the workspace. They lose access until reactivated. */
  public async deactivateUser(superAdminId: string, userId: string) {
    const superAdmin = await this.userRepository.getById(superAdminId);
    if (!superAdmin || superAdmin.role !== UserRoles.SUPER_ADMIN) {
      throw new HttpError('Only Super Admin can deactivate users', StatusCodes.FORBIDDEN);
    }
    if (!superAdmin.company_id) {
      throw new HttpError('Super Admin is not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const target = await this.userRepository.getById(userId);
    if (!target) {
      throw new HttpError('User not found', StatusCodes.NOT_FOUND);
    }
    if (target.role !== UserRoles.ADMIN && target.role !== UserRoles.CONSULTANT) {
      throw new HttpError('Only Admin or Consultant can be deactivated', StatusCodes.BAD_REQUEST);
    }
    const membership = await this.userCompanyRepository.getUserCompany(userId, superAdmin.company_id);
    if (!membership) {
      throw new HttpError('User is not in this workspace', StatusCodes.BAD_REQUEST);
    }
    if (!membership.is_active) {
      throw new HttpError('User is already deactivated', StatusCodes.BAD_REQUEST);
    }

    await this.userCompanyRepository.update({ user_id: userId, company_id: superAdmin.company_id }, { is_active: false, deleted_at: new Date().toISOString() } as any);
    if (target.company_id === superAdmin.company_id) {
      await this.userRepository.update({ id: userId }, { company_id: null });
    }

    this.auditTrailService.createEvent(
      AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
      {
        user_id: superAdminId,
        company_id: superAdmin.company_id,
        description: 'User deactivated',
        entity_description: `${target.name} was deactivated`,
        entity_id: userId,
      },
      superAdminId,
    );
    return { message: 'User deactivated successfully', userId };
  }

  /** Super Admin only: reactivate an admin or consultant. They must set password again (email sent with link). */
  public async reactivateUser(superAdminId: string, userId: string) {
    const superAdmin = await this.userRepository.getById(superAdminId);
    if (!superAdmin || superAdmin.role !== UserRoles.SUPER_ADMIN) {
      throw new HttpError('Only Super Admin can reactivate users', StatusCodes.FORBIDDEN);
    }
    if (!superAdmin.company_id) {
      throw new HttpError('Super Admin is not associated with a company', StatusCodes.BAD_REQUEST);
    }
    const target = await this.userRepository.getById(userId);
    if (!target) {
      throw new HttpError('User not found', StatusCodes.NOT_FOUND);
    }
    const membership = await this.userCompanyRepository.getUserCompany(userId, superAdmin.company_id);
    if (!membership) {
      throw new HttpError('User is not in this workspace', StatusCodes.BAD_REQUEST);
    }
    if (membership.is_active) {
      throw new HttpError('User is already active', StatusCodes.BAD_REQUEST);
    }

    await this.userCompanyRepository.update({ user_id: userId, company_id: superAdmin.company_id }, { is_active: true, deleted_at: null } as any);

    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + TOKEN_EXPIRATION_MS;
    await this.userRepository.update(
      { id: userId },
      {
        password_setup_token: setupToken,
        password_setup_token_expires: tokenExpires,
      },
    );

    const setPasswordLink = `${this.FRONTEND_URL}/set-password?token=${setupToken}`;
    await this.sendEmailTemplate(
      target.email,
      'Your account has been reactivated',
      'Set your password',
      'Your account has been reactivated. Please set your password using the link below to access the system.',
      setPasswordLink,
      'Set password',
      target.name || 'User',
    );

    this.auditTrailService.createEvent(
      AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
      {
        user_id: superAdminId,
        company_id: superAdmin.company_id,
        description: 'User reactivated',
        entity_description: `${target.name} was reactivated`,
        entity_id: userId,
      },
      superAdminId,
    );
    return { message: 'User reactivated. They must set their password using the link sent by email.', userId };
  }

  /** Set password using token (e.g. after reactivation). Clears token so user can log in. */
  public async setPasswordWithToken(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ password_setup_token: token });
    if (!user) {
      throw new HttpError('Invalid or expired token', StatusCodes.BAD_REQUEST);
    }
    if (!user.password_setup_token_expires || user.password_setup_token_expires < Date.now()) {
      throw new HttpError('Token has expired', StatusCodes.BAD_REQUEST);
    }
    await this.validatePasswordStrength(newPassword);
    const hashedPassword = await this.hashPassword(newPassword);
    await this.userRepository.update(
      { id: user.id },
      {
        password: hashedPassword,
        password_setup_token: null,
        password_setup_token_expires: null,
      },
    );
    return { message: 'Password set successfully. You can now log in.' };
  }

  public async completeRegistration(token: string, password: string, name: string) {
    try {
      if (!name) {
        throw new HttpError('Name is required', 400);
      }

      this.validateName(name);

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

            // Add client to company contacts (only if contact doesn't already exist); set status to Active when client completes registration (AC 5)
            const existingContact = await this.contactRepository.findOne({
              email: invitation.email.toLowerCase(),
              company_id: invitation.company_id,
              deleted_at: null,
            });

            if (!existingContact) {
              const contactData = {
                name: userToProcess.name || name,
                email: invitation.email.toLowerCase(),
                phone: userToProcess.phone_number || '',
                company_id: invitation.company_id,
                assigned_to: [], // Empty array or default assignments
                status: 'Active' as const,
              };

              await this.contactRepository.create(contactData);
            } else {
              await this.contactRepository.update({ id: existingContact.id }, { status: 'Active' });
            }

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

      // When client completes registration, set contact status to Active (AC 5; also covers existing user path)
      if (invitation.role === UserRoles.CLIENT) {
        const contactToActivate = await this.contactRepository.findOne({
          email: invitation.email.toLowerCase(),
          company_id: invitation.company_id,
          deleted_at: null,
        });
        if (contactToActivate) {
          await this.contactRepository.update({ id: contactToActivate.id }, { status: 'Active' });
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
      if (!name) {
        throw new HttpError('Name is required', 400);
      }

      this.validateName(name);

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

      // 6. Add client to company contacts (only if contact doesn't already exist)
      const existingContact = await this.contactRepository.findOne({
        email: email.toLowerCase(),
        company_id: companyId,
      });

      if (!existingContact) {
        const contactData: AddContactDto = {
          name,
          email: email.toLowerCase(),
          phone: newUser.phone_number || '',
          company_id: companyId,
          assigned_to: [], // Empty array or default assignments
        };

        await this.contactRepository.create(contactData);
      }

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

      // Prevent admin from inviting their own email address
      if (admin.email.toLowerCase() === email.toLowerCase()) {
        throw new HttpError('You cannot invite your own email address', 400);
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

  public async getCompanyUsersWithStatus(adminId: string, companyId: string, page: number = 1, pageSize: number = 10) {
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

      // Validate pagination parameters
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

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

      // Combine all users into a single flat list
      const allUsers = [...activeUsersList, ...inactiveUsersList, ...disabledUsersList];

      // Sort by invited_at (most recent first)
      allUsers.sort((a, b) => {
        const dateA = a.invited_at ? new Date(a.invited_at).getTime() : 0;
        const dateB = b.invited_at ? new Date(b.invited_at).getTime() : 0;
        return dateB - dateA;
      });

      // Calculate pagination
      const total = allUsers.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);

      return {
        data: paginatedUsers,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch company users', error.statusCode || 500);
    }
  }

  public async resendInvitation(adminId: string, email: string, role: UserRoles) {
    try {
      const admin = await this.userRepository.getById(adminId);
      if (!admin || admin.role !== UserRoles.ADMIN) {
        throw new HttpError('Only company admins can resend invitations', 403);
      }

      if (!admin.company_id) {
        throw new HttpError('Admin is not associated with a company', 400);
      }

      // Prevent admin from resending invitation to their own email address
      if (admin.email.toLowerCase() === email.toLowerCase()) {
        throw new HttpError('You cannot resend invitation to your own email address', 400);
      }

      // Get the invitation by email, company, and role
      const invitation = await this.invitationRepository.findOne({
        email,
        company_id: admin.company_id,
        role,
      });

      if (!invitation) {
        throw new HttpError('Invitation not found', 404);
      }

      // Check if invitation is already accepted
      if (invitation.status === 'ACCEPTED') {
        throw new HttpError('Cannot resend invitation that has already been accepted', 400);
      }

      // Check if user is already in the company
      const existingUser = await this.userRepository.findByEmail(email);
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
        { id: invitation.id },
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
        email,
        `Welcome to Pylott`,
        `Invitation to join ${companyName}`,
        `You have been invited to join ${companyName} as a ${role}. Click the button below to complete your registration:`,
        registrationLink,
        'Complete Registration',
        `Pylott ${role}`,
      );

      // Log invitation resent activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.USER_INVITATION_SENT,
        {
          user_id: adminId,
          company_id: admin.company_id,
          description: 'Invitation resent',
          entity_description: `${admin.name} resent invitation to ${email} as ${role}`,
          entity_id: invitation.id,
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
