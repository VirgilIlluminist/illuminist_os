import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const EMAIL    = process.env.E2E_EMAIL    ?? 'illuministproject@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

// Toast helper — the app's Toast.tsx uses motion.div with no "toast" class.
// Easiest way to detect a toast is to check for the text content.
async function expectToastText(page: import('@playwright/test').Page, pattern: RegExp) {
  // The toast container is fixed bottom-4 right-4; its children contain the message
  await expect(page.locator('.fixed').filter({ hasText: pattern }).first())
    .toBeVisible({ timeout: 8_000 });
}

async function hasErrorFeedback(
  page: import('@playwright/test').Page,
  loginPage: LoginPage,
): Promise<boolean> {
  // Either toast text visible or submit button disabled
  const textVisible = await page.locator('text=/wajib|required|invalid|salah|diisi/i')
    .first().isVisible({ timeout: 5_000 }).catch(() => false);
  const btnDisabled = await loginPage.submitButton().isDisabled().catch(() => false);
  return textVisible || btnDisabled;
}

test.describe('Login', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  // ── Render ───────────────────────────────────────────────────────────────

  test('renders email input', async () => {
    await expect(login.emailInput()).toBeVisible();
  });

  test('renders password input', async () => {
    await expect(login.passwordInput()).toBeVisible();
  });

  test('renders submit button', async () => {
    await expect(login.submitButton()).toBeVisible();
  });

  test('submit button is not disabled on page load', async () => {
    await expect(login.submitButton()).toBeEnabled();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test('shows error when submitting empty form', async ({ page }) => {
    await login.submit();
    await page.waitForTimeout(800); // let toast animate in
    const ok = await hasErrorFeedback(page, login);
    expect(ok).toBeTruthy();
  });

  test('shows error with wrong credentials', async ({ page }) => {
    test.skip(!PASSWORD, 'Needs E2E_PASSWORD in .env to test Supabase auth errors');
    await login.fillEmail('nobody@nowhere.com');
    await login.fillPassword('wrongpassword123');
    await login.submit();
    // wait for Supabase response and toast
    await page.waitForTimeout(500);
    const ok = await page
      .locator('text=/salah|invalid|credentials|email.*password/i')
      .first().isVisible({ timeout: 12_000 }).catch(() => false);
    expect(ok).toBeTruthy();
  });

  test('shows error when only email filled', async ({ page }) => {
    await login.fillEmail(EMAIL);
    await login.submit();
    await page.waitForTimeout(800);
    const ok = await hasErrorFeedback(page, login);
    expect(ok).toBeTruthy();
  });

  // ── Sign-up toggle ────────────────────────────────────────────────────────

  test('can toggle to sign-up mode', async ({ page }) => {
    const toggle = page.locator('button[type="button"]').filter({ hasText: /daftar|sign up/i });
    if (await toggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await toggle.click();
      await expect(login.submitButton()).toBeVisible();
    }
  });

  test('toggling back to sign-in works', async ({ page }) => {
    const toSignUp = page.locator('button[type="button"]').filter({ hasText: /daftar|sign up/i });
    if (await toSignUp.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await toSignUp.click();
      const toSignIn = page.locator('button[type="button"]').filter({ hasText: /masuk|login|sign in/i });
      if (await toSignIn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await toSignIn.click();
        await expect(login.submitButton()).toBeVisible();
      }
    }
  });

  // ── Successful login ──────────────────────────────────────────────────────

  test('successful login redirects to /app/dashboard', async () => {
    test.skip(!PASSWORD, 'Add E2E_PASSWORD=<your_password> to .env');
    await login.login(EMAIL, PASSWORD);
    await login.expectRedirectedToDashboard();
  });

  test('already-authenticated user is bounced from /login', async ({ page }) => {
    test.skip(!PASSWORD, 'Add E2E_PASSWORD=<your_password> to .env');
    await login.login(EMAIL, PASSWORD);
    await login.expectRedirectedToDashboard();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});
