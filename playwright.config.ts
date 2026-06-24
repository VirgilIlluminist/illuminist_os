import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const SESSION_FILE = join(__dirname, 'e2e/.auth/session.json');

/** Only use storageState if the file exists and contains a real session. */
function getStorageState(): string | undefined {
  if (!existsSync(SESSION_FILE)) return undefined;
  try {
    const content = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
    // A real session has cookies or origins with localStorage entries
    const hasCookies = Array.isArray(content.cookies) && content.cookies.length > 0;
    const hasOrigins = Array.isArray(content.origins) && content.origins.length > 0;
    return hasCookies || hasOrigins ? SESSION_FILE : undefined;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 45_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on' : 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    storageState: getStorageState(),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
