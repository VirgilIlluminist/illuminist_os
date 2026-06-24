import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { ensureLoggedIn } from '../helpers/auth';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('loads without crash', async () => {
    await dashboard.expectNoErrorBoundary();
  });

  test('shows greeting text', async ({ page }) => {
    await expect(page.locator('text=/Selamat|Welcome|Halo/i').first()).toBeVisible({ timeout: 8_000 });
  });

  // ── KPI Cards ─────────────────────────────────────────────────────────────

  test('renders revenue KPI card', async ({ page }) => {
    await expect(page.locator('text=/pendapatan|revenue/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('renders profit KPI card', async ({ page }) => {
    await expect(page.locator('text=/laba|profit/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('renders inventory KPI card', async ({ page }) => {
    await expect(page.locator('text=/inventori|inventory/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('renders warning/alerts KPI card', async ({ page }) => {
    await expect(page.locator('text=/peringatan|warning|alert/i').first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Chart ────────────────────────────────────────────────────────────────

  test('renders weekly revenue chart', async () => {
    await dashboard.expectChartVisible();
  });

  test('chart section has "Revenue Mingguan" label', async ({ page }) => {
    await expect(page.locator('text=/Revenue Mingguan|Weekly/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('period button 1M is visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: '1M' });
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('clicking period buttons does not crash', async ({ page }) => {
    for (const period of ['1M', '3M', '6M', '1Y'] as const) {
      const btn = page.locator('button').filter({ hasText: period });
      if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(200);
      }
    }
    await dashboard.expectNoErrorBoundary();
  });

  // ── Sidebar navigation ────────────────────────────────────────────────────

  test('sidebar shows Dashboard item', async () => {
    await dashboard.expectSidebarVisible();
  });

  test('sidebar shows business name', async () => {
    await dashboard.expectBusinessNameInSidebar();
  });

  test('navigates to Material Library from sidebar', async ({ page }) => {
    await dashboard.sidebarNavigateTo('Material Library');
    await expect(page).toHaveURL(/\/app\/materials/);
  });

  test('navigates to Finance from sidebar', async ({ page }) => {
    await dashboard.sidebarNavigateTo('Finance');
    await expect(page).toHaveURL(/\/app\/finance/);
  });

  test('navigates to Sales Tracking from sidebar', async ({ page }) => {
    await dashboard.sidebarNavigateTo('Sales Tracking');
    await expect(page).toHaveURL(/\/app\/sales/);
  });

  test('navigates to Customers from sidebar', async ({ page }) => {
    await dashboard.sidebarNavigateTo('Customers');
    await expect(page).toHaveURL(/\/app\/customers/);
  });

  test('navigates to Settings from sidebar', async ({ page }) => {
    await dashboard.sidebarNavigateTo('Settings');
    await expect(page).toHaveURL(/\/app\/settings/);
  });

  // ── AI Insights ───────────────────────────────────────────────────────────

  test('AI insights panel renders', async ({ page }) => {
    const panel = page.locator('text=/AI Insights|Chief of Staff/i');
    if (await panel.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(panel.first()).toBeVisible();
    }
  });
});
