import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/jwt';
import { ObjectId } from 'mongodb';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: ObjectId;
    email: string;
  };
}

export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

export function requireAuth(request: NextRequest): { userId: ObjectId; email: string } {
  const payload = authenticateRequest(request);
  
  if (!payload) {
    throw new Error('Unauthorized');
  }

  return {
    userId: new ObjectId(payload.userId),
    email: payload.email,
  };
}
