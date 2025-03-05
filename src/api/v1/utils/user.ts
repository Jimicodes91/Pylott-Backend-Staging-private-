import mongoose from "mongoose";

export enum UserRole {
    PYLOTT_ADMIN = 'PYLOTT_ADMIN',
    COMPANY_ADMIN = 'COMPANY_ADMIN',
    CONSULTANT = 'CONSULTANT',
    CLIENT = 'CLIENT'
  }
  
  export interface IUser extends mongoose.Document {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    role: UserRole;
    language:string;
    currency:string;
    isBlocked:boolean;
    pfp:string;
    company?: string;
    isVerified: boolean;
    isActive: boolean;
    lastLogin?: Date;
    verificationToken?: string;
    tokenExpires?: number;
    passwordSetupToken:string;
    passwordSetupTokenExpires:number;
  }

  export interface IVerificationToken extends mongoose.Document {
    user: mongoose.Types.ObjectId;
    token: string;
    createdAt: Date;
    expiresAt: Date;
    tokenType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  }
export interface AdminSignupData{
    email:string;
    password:string;
}

export interface EmailVerificationData{
    token: string; 
    email: string;
}