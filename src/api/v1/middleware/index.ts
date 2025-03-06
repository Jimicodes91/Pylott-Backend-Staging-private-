import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import HttpError from "../utils/errorHandler";
import { UserRole } from "../utils/user";

export const authenticateUser = (req: JwtPayload, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new HttpError("Access denied. No token provided.", 401);
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      email: string;
      role: string;
    };

    // Attach the user information to the request object
    req.user = decoded;

    next();
  } catch (error: any) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
export const authorizeRole = (allowedRoles: UserRole[]) => {
    return (req: JwtPayload, res: Response, next: NextFunction) => {
      try {
        const userRole = req.user?.role;
  
        if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
          throw new HttpError("Access denied. You do not have permission to access this resource.", 403);
        }
  
        next();
      } catch (error: any) {
        res.status(403).json({ error: error.message });
      }
    };
  };

  export interface CustomRequest extends Request {
    user: any;
  }
  

  export const verifyJWT = (req: JwtPayload, res: Response, next: NextFunction) => {
    // Check if authorization header is present
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing! Provide authorization header' });
    }
  
    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing! Provide token' });
    }
  
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as CustomRequest).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };