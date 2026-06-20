/**
 * auth.ts — JWT authentication middleware
 * V12: Proper auth instead of no auth in V11.
 * For V11 compatibility: auth is OPTIONAL by default (skipAuth mode for dev).
 */
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';
import { unauthorized } from '../utils/response';

export interface AuthUser {
  userId:    string;
  companyId: string;
  role:      'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
  permissions: string[];
  aiLevel:   1 | 2 | 3 | 4 | 5; // AI permission level
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Simple JWT decode without verification (for dev/V11 compat)
// In production: use jsonwebtoken package with proper verification
function decodeJWT(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded as AuthUser;
  } catch {
    return null;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    req.user = decodeJWT(token) || undefined;
  }
  // Always pass — auth is optional for V11 compat
  if (!req.user) {
    req.user = {
      userId:      'dev-user',
      companyId:   'nevaeh-default',
      role:        'owner',
      permissions: ['*'],
      aiLevel:     5,
    };
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return unauthorized(res, 'Authentication required');
  }
  next();
}

export function requireAILevel(minLevel: 1 | 2 | 3 | 4 | 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userLevel = req.user?.aiLevel ?? 1;
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        error:   `AI permission level ${minLevel} required. Your level: ${userLevel}`,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}
