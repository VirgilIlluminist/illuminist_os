import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForApp() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
  }

  // ── Toast ───────────────────────────────────────────────────────────────────

  /** Wait for any visible toast/alert notification. */
  async expectToast(text?: string | RegExp) {
    // covers both div[class*="toast"] and role=alert
    const locator = this.page.locator(
      '[class*="toast"], [class*="Toast"], [role="alert"], [class*="notification"]'
    ).first();
    await expect(locator).toBeVisible({ timeout: 8_000 });
    if (text) await expect(locator).toContainText(text, { timeout: 8_000 });
  }

  async toastIsVisible(): Promise<boolean> {
    return this.page
      .locator('[class*="toast"], [class*="Toast"], [role="alert"], [class*="notification"]')
      .first()
      .isVisible({ timeout: 6_000 })
      .catch(() => false);
  }

  // ── Modal ───────────────────────────────────────────────────────────────────

  async expectModalOpen(headingText: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: headingText }),
    ).toBeVisible({ timeout: 6_000 });
  }

  async expectModalClosed(headingText: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: headingText }),
    ).toHaveCount(0, { timeout: 5_000 });
  }

  async clickCancel() {
    await this.page.locator('button').filter({ hasText: /batal|cancel/i }).first().click();
  }

  async clickDelete() {
    await this.page.locator('button').filter({ hasText: /hapus|delete/i }).first().click();
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────

  async clickTab(label: string | RegExp) {
    const btn = this.page.locator('button').filter({ hasText: label }).first();
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();
    await this.page.waitForTimeout(200);
  }

  // ── Table ───────────────────────────────────────────────────────────────────

  async expectTextVisible(text: string) {
    await expect(this.page.locator(`text="${text}"`).first()).toBeVisible({ timeout: 6_000 });
  }

  async expectTextAbsent(text: string) {
    await expect(this.page.locator(`text="${text}"`)).toHaveCount(0, { timeout: 5_000 });
  }

  // ── Crash guard ─────────────────────────────────────────────────────────────

  async expectNoCrash() {
    await expect(
      this.page.locator('text=/Something went wrong|Error boundary|Uncaught/i')
    ).toHaveCount(0);
  }
}
