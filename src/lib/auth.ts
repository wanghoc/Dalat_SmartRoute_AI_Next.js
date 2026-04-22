import jwt from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { jsonError } from '@/lib/http';

export type AppUserRole = 'ADMIN' | 'VISITOR';

type TokenPayload = {
  userId: number;
  role?: AppUserRole;
  iat?: number;
  exp?: number;
};

type AuthResult =
  | {
      userId: number;
      role: AppUserRole;
    }
  | {
      response: Response;
    };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function signToken(payload: { userId: number; role: AppUserRole }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function requireUserId(request: Request): AuthResult {
  const token = readBearerToken(request);
  if (!token) {
    return { response: jsonError(401, 'Authentication required') };
  }

  try {
    const decoded = verifyToken(token);
    return {
      userId: decoded.userId,
      role: decoded.role ?? 'VISITOR',
    };
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      return { response: jsonError(401, 'Invalid token') };
    }

    return { response: jsonError(401, 'Authentication failed') };
  }
}

export function requireAdmin(request: Request): AuthResult {
  const auth = requireUserId(request);
  if ('response' in auth) {
    return auth;
  }

  if (auth.role !== 'ADMIN') {
    return { response: jsonError(403, 'Admin access required') };
  }

  return auth;
}
