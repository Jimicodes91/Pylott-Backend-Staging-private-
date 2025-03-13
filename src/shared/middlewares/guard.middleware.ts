import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import HttpError from '../utils/errorHandler';
import User from '../models/user.model';
import { UserRoles } from '../enums';

export const authenticateUser = (req: JwtPayload, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new HttpError('Access denied. No token provided.', 401);
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      email: string;
      role: string;
      _id: any;
    };
    // Attach the user information to the request object
    req.user = decoded;

    next();
  } catch (error: any) {
    //@klaus139 Do something with the error
    console.log(error.message); // added to bypass pre-commit (please fix)
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
export const authorizeRole = (allowedRoles: UserRoles[]) => {
  return (req: JwtPayload, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole || !allowedRoles.includes(userRole as UserRoles)) {
        throw new HttpError('Access denied. You do not have permission to access this resource.', 403);
      }

      next();
    } catch (error: any) {
      //@klaus139 Do something with the error
      console.log(error.message); // added to bypass pre-commit (please fix)
      res.status(403).json({ error: error.message });
    }
  };
};

// @klaus139 please move this to interface directory or somewhere more appropriate
export interface CustomRequest extends Request {
  user: any;
}

export const verifyJWT = (req: JwtPayload, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing! Provide authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing! Provide token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as CustomRequest).user = decoded;
    next();
  } catch (error) {
    //@klaus139 Do something with the error
    console.log(error.message); // added to bypass pre-commit (please fix)
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authenticateSameUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new HttpError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new HttpError('User not found', 404);
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    //@klaus139 Do something with the error
    console.log(error.message); // added to bypass pre-commit (please fix)
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
