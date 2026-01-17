import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(userId: ObjectId, email: string): string {
  return jwt.sign({ userId: userId.toString(), email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
