import { container } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import HttpError from '../utils/errorHandler';
import { UserRoles } from '../enums';
import { CustomRequest, UserPayload } from '../interface';
import { UserRepository } from '@/repositories';
import { JWT_SECRET_KEY } from '@/config/env';

const userRepo = container.resolve(UserRepository);

// Fixed middleware with no return value
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next(new HttpError('Access denied. No token provided.', 401));
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
      email: string;
      role: string;
      _id: any;
    };

    const user = await userRepo.getById(decoded._id);

    if (!user) {
      return next(new HttpError('User not found.', 404));
    }

    (req as any).user = { ...decoded, ...user };

    console.log(`[AuthGuard] ===> ${JSON.stringify(req.user)}`);

    return next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new HttpError('Invalid or expired token', 401));
    }

    return next(new HttpError(error.message || 'Authentication failed', error.statusCode || 500));
  }
};

export const authorizeRole = (allowedRoles: UserRoles[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = (req as any).user.role;
      if (!userRole || !allowedRoles.includes(userRole as UserRoles)) {
        return next(new HttpError('Access denied. You do not have permission to access this resource.', 403));
      }
      return next();
    } catch (error: any) {
      return next(new HttpError(error.message || 'Authorization failed', error.statusCode || 500));
    }
  };
};

export const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return next(new HttpError('Authorization header missing! Provide authorization header', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new HttpError('Token missing! Provide token', 401));
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as UserPayload;
    req.user = decoded;

    return next();
  } catch (error: any) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new HttpError('Invalid token', 401));
    }

    // Handle other errors
    return next(new HttpError(error.message || 'Token verification failed', error.statusCode || 500));
  }
};
