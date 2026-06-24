/**
 * rateLimit.ts — Per-user + per-IP rate limiter (in-memory).
 * Key: userId (when authenticated) OR IP (anonymous fallback).
 * Sets standard RateLimit-* headers on every response.
 */
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

interface RateLimitEntry { count: number; resetAt: number }
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => { if (v.resetAt < now) store.delete(k); });
}, 60_000);

function identity(req: Request): string {
  // Prefer authenticated user ID — prevents shared-IP abuse hiding behind anon rate
  const userId = req.user?.userId;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
}

export function rateLimit(maxRequests: number, windowMs: number, scope = 'api') {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${scope}:${identity(req)}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSecs  = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('RateLimit-Limit',     maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset',     resetSecs);

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', resetSecs);
      return res.status(429).json({
        success:    false,
        error:      'Too many requests. Please wait before retrying.',
        retryAfter: resetSecs,
        timestamp:  new Date().toISOString(),
      });
    }
    next();
  };
}

export const apiLimiter   = rateLimit(ENV.RATE_LIMIT_MAX,    ENV.RATE_LIMIT_WINDOW_MS, 'api');
export const aiLimiter    = rateLimit(ENV.AI_RATE_LIMIT_MAX, ENV.RATE_LIMIT_WINDOW_MS, 'ai');
export const strictLimiter= rateLimit(5, 60_000, 'strict');
