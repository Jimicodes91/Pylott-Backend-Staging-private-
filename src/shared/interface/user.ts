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
  phone_number?: string;
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
  phone_number?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  pfp?: string;
}

export interface CompanyAdminSignpData {
  email: string;
  password: string;
  //name: string;
}

/** Payload for self-serve workspace creation: user provides signup_token (from OTP verification) + profile & company details */
export interface WorkspaceSignupData {
  signup_token: string;
  password: string;
  name: string;
  workspace_name: string;
  industry_type: string;
  size: string;
  country: string;
  address: string;
  city: string;
}

export interface EmailVerificationData {
  token: string;
  email: string;
}

export interface loginData {
  email: string;
  password: string;
}
