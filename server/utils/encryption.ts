/**
 * encryption.ts — API key encryption/decryption
 * API keys stored encrypted in config. Never exposed to frontend.
 */
import { ENV } from '../config/env';

// Simple XOR-based obfuscation for storing API keys
// In production: use Node.js crypto module with AES-256-GCM
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return Buffer.from(result).toString('base64');
}

function xorDecrypt(encoded: string, key: string): string {
  const decoded = Buffer.from(encoded, 'base64').toString();
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return '';
  return xorEncrypt(plaintext, ENV.ENCRYPTION_KEY);
}

export function decryptApiKey(encrypted: string): string {
  if (!encrypted) return '';
  return xorDecrypt(encrypted, ENV.ENCRYPTION_KEY);
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 6) + '...' + key.slice(-4);
}
