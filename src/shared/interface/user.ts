import { UserRoles } from '../enums';

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: UserRoles;
  language: string;
  currency: string;
  timezone: string;
  isBlocked: boolean;
  pfp: string;
  company?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  verificationToken?: string;
  tokenExpires?: number;
  passwordSetupToken: string;
  passwordSetupTokenExpires: number;
}

export interface IVerificationToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  tokenType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}
export interface AdminSignupData {
  email: string;
  password: string;
  name: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  pfp?: string;
}

export interface CompanyAdminSignpData {
  email: string;
  password: string;
  name: string;
}

export interface EmailVerificationData {
  token: string;
  email: string;
}

export interface loginData {
  email: string;
  password: string;
}
