/**
 * rateLimit.ts — Simple in-memory rate limiter
 * No external packages needed. Replace with express-rate-limit in production.
 */
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

function cleanup() {
  const now = Date.now();
  Object.keys(store).forEach(k => {
    if (store[k].resetAt < now) delete store[k];
  });
}

setInterval(cleanup, 60000);

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();

    if (!store[key] || store[key].resetAt < now) {
      store[key] = { count: 1, resetAt: now + windowMs };
      return next();
    }

    store[key].count++;
    if (store[key].count > maxRequests) {
      return res.status(429).json({
        success:   false,
        error:     'Too many requests. Please wait.',
        retryAfter: Math.ceil((store[key].resetAt - now) / 1000),
        timestamp:  new Date().toISOString(),
      });
    }
    next();
  };
}

export const apiLimiter  = rateLimit(ENV.RATE_LIMIT_MAX,    ENV.RATE_LIMIT_WINDOW_MS);
export const aiLimiter   = rateLimit(ENV.AI_RATE_LIMIT_MAX, ENV.RATE_LIMIT_WINDOW_MS);
export const strictLimiter= rateLimit(5, 60000);
