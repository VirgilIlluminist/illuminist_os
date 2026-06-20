/**
 * logger.ts — Structured logging utility
 * Replace console.log across entire codebase with this.
 */
import { ENV } from '../config/env';

type Level = 'info' | 'warn' | 'error' | 'debug' | 'ai';

const COLORS: Record<Level, string> = {
  info:  '\x1b[36m',   // cyan
  warn:  '\x1b[33m',   // yellow
  error: '\x1b[31m',   // red
  debug: '\x1b[35m',   // magenta
  ai:    '\x1b[32m',   // green
};
const RESET = '\x1b[0m';

function log(level: Level, module: string, message: string, data?: unknown) {
  if (level === 'debug' && ENV.IS_PROD) return;
  const color = COLORS[level];
  const ts    = new Date().toISOString();
  const tag   = `[${ts}] ${color}[${level.toUpperCase()}]${RESET} [${module}]`;
  if (data) {
    console.log(`${tag} ${message}`, data);
  } else {
    console.log(`${tag} ${message}`);
  }
}

export const logger = {
  info:  (module: string, msg: string, data?: unknown) => log('info',  module, msg, data),
  warn:  (module: string, msg: string, data?: unknown) => log('warn',  module, msg, data),
  error: (module: string, msg: string, data?: unknown) => log('error', module, msg, data),
  debug: (module: string, msg: string, data?: unknown) => log('debug', module, msg, data),
  ai:    (module: string, msg: string, data?: unknown) => log('ai',    module, msg, data),
};
