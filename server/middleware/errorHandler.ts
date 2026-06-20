/**
 * errorHandler.ts — Global Express error handler
 * All uncaught errors flow here. Never let raw error details reach client in prod.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export class AppError extends Error {
  constructor(
    public message:    string,
    public statusCode: number  = 500,
    public code?:      string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code       = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  logger.error('ErrorHandler', `${req.method} ${req.path} → ${err.message}`, {
    statusCode,
    code,
    stack: ENV.IS_PROD ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success:   false,
    error:     ENV.IS_PROD && statusCode === 500 ? 'Internal server error' : err.message,
    code,
    timestamp: new Date().toISOString(),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success:   false,
    error:     `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
}
