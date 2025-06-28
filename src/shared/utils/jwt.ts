import { JWT_SECRET_KEY } from '@/config/env';
import jwt from 'jsonwebtoken';

export const generateToken = (email: string, userId: any): string => {
  return jwt.sign({ email, id: userId }, JWT_SECRET_KEY, {
    expiresIn: '1d',
  });
};

export const generateRandomPassword = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};
