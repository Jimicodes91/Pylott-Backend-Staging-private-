import { Request } from 'express';
import { UserModelType } from '@/models';

export interface IAuthenticatedRequest extends UserModelType {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: IAuthenticatedRequest;
}

declare global {
  namespace Express {
    interface Request {
      user: IAuthenticatedRequest;
    }
  }
}
