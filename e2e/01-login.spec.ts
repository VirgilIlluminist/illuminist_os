import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('login page renders correctly', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on empty submission', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    // Toast or inline error should appear
    const errorVisible = await page
      .locator('[role="alert"], [class*="toast"], [class*="error"]')
      .first()
      .isVisible()
      .catch(() => false);
    // Alternatively the button may be disabled — either is acceptable
    const submitDisabled = await page.locator('button[type="submit"]').isDisabled();
    expect(errorVisible || submitDisabled).toBeTruthy();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.locator('[role="alert"], [class*="toast"]').filter({ hasText: /salah|invalid|credentials/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('can toggle to sign-up mode', async ({ page }) => {
    const signupToggle = page.locator('button').filter({ hasText: /daftar|sign up|signup|buat akun/i });
    if (await signupToggle.isVisible()) {
      await signupToggle.click();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('**/app/dashboard', { timeout: 20_000 });
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('already logged-in user is redirected away from /login', async ({ page }) => {
    // Login first
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/dashboard', { timeout: 20_000 });

    // Revisit /login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});
