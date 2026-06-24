import { chromium, FullConfig } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Read a key from the project .env file (not just process.env). */
function readEnvFile(): Record<string, string> {
  try {
    const envPath = join(__dirname, '../.env');
    const raw = readFileSync(envPath, 'utf-8');
    const result: Record<string, string> = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return result;
  } catch {
    return {};
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  const envFile = readEnvFile();

  const email    = process.env.E2E_EMAIL    ?? envFile.E2E_EMAIL    ?? 'illuministproject@gmail.com';
  const password = process.env.E2E_PASSWORD ?? envFile.E2E_PASSWORD ?? '';

  if (!password) {
    console.warn('[global-setup] E2E_PASSWORD not set — add it to .env or set env var. Tests will login per-suite.');
    return;
  }

  const authPath = join(__dirname, '.auth/session.json');
  const browser  = await chromium.launch();
  const page     = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/app/dashboard', { timeout: 20_000 });
    await page.context().storageState({ path: authPath });
    console.log(`[global-setup] Session saved for ${email}`);
  } catch (err) {
    console.warn('[global-setup] Login failed:', (err as Error).message);
    console.warn('[global-setup] Tests will authenticate individually.');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
