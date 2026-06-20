/**
 * env.ts — Centralized environment configuration
 * All env vars validated and typed here. Never read process.env directly elsewhere.
 */
import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) console.warn(`[ENV] Warning: ${key} is not set. Related feature will use fallback.`);
  return val || '';
}

function optional(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

export const ENV = {
  // Server
  PORT:          parseInt(optional('PORT', '3000')),
  NODE_ENV:      optional('NODE_ENV', 'development'),
  IS_PROD:       optional('NODE_ENV') === 'production',

  // Security
  JWT_SECRET:    optional('JWT_SECRET', 'nevaeh-dev-secret-change-in-prod'),
  ENCRYPTION_KEY:optional('ENCRYPTION_KEY', 'nevaeh-enc-key-32chars-change!!'),

  // AI Providers
  GEMINI_API_KEY:  optional('GEMINI_API_KEY'),
  OPENAI_API_KEY:  optional('OPENAI_API_KEY'),
  CLAUDE_API_KEY:  optional('CLAUDE_API_KEY'),
  OPENROUTER_KEY:  optional('OPENROUTER_API_KEY'),

  // AI defaults
  AI_DEFAULT_PROVIDER: optional('AI_DEFAULT_PROVIDER', 'gemini'),
  AI_MAX_TOKENS:       parseInt(optional('AI_MAX_TOKENS', '4096')),
  AI_TEMPERATURE:      parseFloat(optional('AI_TEMPERATURE', '0.2')),
  AI_PERMISSION_LEVEL: parseInt(optional('AI_PERMISSION_LEVEL', '2')),

  // Rate limits
  RATE_LIMIT_WINDOW_MS:  parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000')),
  RATE_LIMIT_MAX:        parseInt(optional('RATE_LIMIT_MAX', '100')),
  AI_RATE_LIMIT_MAX:     parseInt(optional('AI_RATE_LIMIT_MAX', '20')),

  // App
  APP_NAME:    optional('APP_NAME', 'NEVAEH AI OS'),
  APP_VERSION: optional('APP_VERSION', '1.0.0'),

  // Supabase (server-side, pakai service role key)
  SUPABASE_URL:              optional('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY:         optional('VITE_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: optional('SUPABASE_SERVICE_ROLE_KEY'),
  IS_DB_ENABLED: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
} as const;

export type Env = typeof ENV;
