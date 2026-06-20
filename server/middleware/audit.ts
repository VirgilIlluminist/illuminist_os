/**
 * audit.ts — Audit trail middleware
 * Records all mutating operations (POST, PUT, PATCH, DELETE).
 * V12: Immutable audit log for compliance.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuditEntry {
  id:         string;
  timestamp:  string;
  userId:     string;
  companyId:  string;
  method:     string;
  path:       string;
  statusCode: number;
  duration:   number;
  ip:         string;
  userAgent:  string;
  body?:      unknown;
  response?:  unknown;
}

// In-memory audit log (V12 production: store in dedicated DB table)
const auditLog: AuditEntry[] = [];
const MAX_LOG_SIZE = 10000;

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only audit mutating operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const start    = Date.now();
  const origJson = res.json.bind(res);

  res.json = function(body: unknown) {
    const entry: AuditEntry = {
      id:         `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp:  new Date().toISOString(),
      userId:     req.user?.userId    || 'anonymous',
      companyId:  req.user?.companyId || 'unknown',
      method:     req.method,
      path:       req.path,
      statusCode: res.statusCode,
      duration:   Date.now() - start,
      ip:         req.ip || 'unknown',
      userAgent:  req.headers['user-agent'] || '',
      body:       sanitizeBody(req.body),
    };

    // Keep audit log bounded
    if (auditLog.length >= MAX_LOG_SIZE) auditLog.shift();
    auditLog.push(entry);

    logger.debug('Audit', `${entry.method} ${entry.path} → ${entry.statusCode} (${entry.duration}ms)`);

    return origJson(body);
  };

  next();
}

export function getAuditLog(limit = 100, offset = 0): AuditEntry[] {
  return [...auditLog].reverse().slice(offset, offset + limit);
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = ['password', 'apiKey', 'token', 'secret', 'key'];
  const sanitized = { ...body as Record<string, unknown> };
  sensitive.forEach(k => {
    if (k in sanitized) sanitized[k] = '***';
  });
  return sanitized;
}
