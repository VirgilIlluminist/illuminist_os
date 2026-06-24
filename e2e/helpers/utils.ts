import { Page, expect } from '@playwright/test';

/** Navigate via sidebar label (exact text match). */
export async function navigateTo(page: Page, label: string): Promise<void> {
  await page.locator(`text="${label}"`).first().click();
  await page.waitForLoadState('networkidle');
}

/** Wait for a toast notification containing the given text. */
export async function expectToast(page: Page, text: string): Promise<void> {
  await expect(
    page.locator(`[role="alert"], .toast, [class*="toast"]`).filter({ hasText: text }),
  ).toBeVisible({ timeout: 8_000 });
}

/** Click a button whose visible text matches. */
export async function clickButton(page: Page, label: string): Promise<void> {
  await page.locator(`button:has-text("${label}")`).first().click();
}

/** Fill an input that has a sibling label containing labelText. */
export async function fillField(
  page: Page,
  placeholder: string,
  value: string,
): Promise<void> {
  await page.locator(`input[placeholder="${placeholder}"]`).fill(value);
}

/** Wait for a modal heading to appear. */
export async function expectModal(page: Page, heading: string): Promise<void> {
  await expect(page.locator(`h3:has-text("${heading}")`)).toBeVisible({ timeout: 6_000 });
}

/** Close modal via Cancel / Batal button. */
export async function closeModal(page: Page): Promise<void> {
  const cancelBtn = page
    .locator('button')
    .filter({ hasText: /cancel|batal/i })
    .first();
  if (await cancelBtn.isVisible()) await cancelBtn.click();
}
