/**
 * response.ts — Standardized API response helpers
 * All routes use these to ensure consistent response format.
 */
import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success:   boolean;
  data?:     T;
  error?:    string;
  message?:  string;
  meta?:     Record<string, unknown>;
  timestamp: string;
}

export function ok<T>(res: Response, data: T, message?: string, meta?: Record<string, unknown>) {
  return res.json({
    success:   true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message = 'Created successfully') {
  return res.status(201).json({
    success:   true,
    data,
    message,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<T>);
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({
    success:   false,
    error,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}

export function unauthorized(res: Response, error = 'Unauthorized') {
  return res.status(401).json({
    success:   false,
    error,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}

export function forbidden(res: Response, error = 'Forbidden') {
  return res.status(403).json({
    success:   false,
    error,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}

export function notFound(res: Response, error = 'Not found') {
  return res.status(404).json({
    success:   false,
    error,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}

export function serverError(res: Response, error: string) {
  return res.status(500).json({
    success:   false,
    error,
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse);
}
