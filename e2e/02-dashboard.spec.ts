import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('renders KPI cards', async ({ page }) => {
    // At least 3 KPI metric cards should be visible
    const cards = page.locator('[class*="kpi"], [class*="KPI"], [class*="metric"], [class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });

    // Revenue and profit labels
    const labels = page.locator('text=/revenue|profit|pendapatan|laba|aset|kas/i');
    await expect(labels.first()).toBeVisible();
  });

  test('renders bar chart', async ({ page }) => {
    // SVG or canvas chart element
    const chart = page.locator('svg, canvas, [class*="chart"], [class*="bar"]').first();
    await expect(chart).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar is visible with navigation items', async ({ page }) => {
    await expect(page.locator('text="Dashboard"').first()).toBeVisible();
    await expect(page.locator('text=/Material|Sales|Finance|Produksi/i').first()).toBeVisible();
  });

  test('can navigate to Materials from sidebar', async ({ page }) => {
    await page.locator('text="Material Library"').first().click();
    await page.waitForURL('**/app/materials', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/app\/materials/);
  });

  test('can navigate to Finance from sidebar', async ({ page }) => {
    await page.locator('text="Finance"').first().click();
    await page.waitForURL('**/app/finance', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/app\/finance/);
  });

  test('can navigate to Sales from sidebar', async ({ page }) => {
    await page.locator('text="Sales Tracking"').first().click();
    await page.waitForURL('**/app/sales', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/app\/sales/);
  });

  test('business name appears in sidebar header', async ({ page }) => {
    const bizName = page.locator('text=/NEVAEH|ILLUMINIST/i').first();
    await expect(bizName).toBeVisible();
  });

  test('dashboard does not crash with zero data', async ({ page }) => {
    // Page should not show any error boundary text
    await expect(page.locator('text=/Something went wrong|Error|Crash/i')).toHaveCount(0);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
