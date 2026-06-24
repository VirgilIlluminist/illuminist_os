import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnvPassword(): string {
  try {
    const raw = readFileSync(join(__dirname, '../../.env'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('E2E_PASSWORD=')) {
        return trimmed.slice('E2E_PASSWORD='.length).trim();
      }
    }
  } catch { /* ignore */ }
  return '';
}

export const TEST_EMAIL    = process.env.E2E_EMAIL    ?? 'illuministproject@gmail.com';
export const TEST_PASSWORD = process.env.E2E_PASSWORD ?? readEnvPassword();

/** Full login — navigates to /login, fills form, waits for dashboard. */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/app/dashboard', { timeout: 20_000 });
}

/**
 * Navigate to dashboard, performing login if redirected to /login.
 * If E2E_PASSWORD is not set, navigates but does NOT attempt login
 * (tests that need auth will fail fast with a clear timeout).
 */
export async function ensureLoggedIn(page: Page): Promise<void> {
  await page.goto('/app/dashboard');
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/login') && TEST_PASSWORD) {
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/dashboard', { timeout: 20_000 });
  }
}
