import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'learnpath_prod_secure_secret_key_8f3a9b2c1d4e7f6a5b8c9d0e1f2a3b4c';
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};
