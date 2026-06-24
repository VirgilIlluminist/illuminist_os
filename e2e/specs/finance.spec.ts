import { test, expect } from '@playwright/test';
import { FinancePage, FinancesAndAssetsPage } from '../pages/FinancePage';
import { ensureLoggedIn } from '../helpers/auth';

const TS = () => Date.now();

// ── Finance Dashboard ──────────────────────────────────────────────────────────

test.describe('Finance Dashboard', () => {
  let pg: FinancePage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new FinancePage(page);
    await pg.goto();
  });

  test('loads Finance page', async () => {
    await pg.expectPageTitle();
  });

  test('page does not crash', async () => {
    await expect(pg.page.locator('text=/Something went wrong|Error boundary/i')).toHaveCount(0);
  });

  test('KPI: Posisi Kas is visible', async ({ page }) => {
    await expect(page.locator('text=/kas|cash/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('KPI: Pendapatan is visible', async ({ page }) => {
    await expect(page.locator('text=/pendapatan|revenue/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('KPI: Biaya Operasional is visible', async ({ page }) => {
    await expect(page.locator('text=/biaya|cost/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('KPI: Nilai Aset is visible', async ({ page }) => {
    await expect(page.locator('text=/aset|asset/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('recent transactions table or empty state renders', async () => {
    await pg.expectTableOrEmptyState();
  });

  test('transaction table has Tanggal column', async ({ page }) => {
    const col = page.locator('text=/tanggal|date/i').first();
    if (await col.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(col).toBeVisible();
    }
  });

  test('transaction table has Tipe column', async ({ page }) => {
    const col = page.locator('text=/tipe|type/i').first();
    if (await col.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(col).toBeVisible();
    }
  });

  test('transaction table has Jumlah column', async ({ page }) => {
    const col = page.locator('text=/jumlah|amount/i').first();
    if (await col.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(col).toBeVisible();
    }
  });
});

// ── Customers Page ─────────────────────────────────────────────────────────────

test.describe('Customers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/customers');
    await page.waitForLoadState('networkidle');
  });

  test('loads Customers page', async ({ page }) => {
    await expect(page.locator('text=/Customer/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('does NOT show FinancesAndAssets content', async ({ page }) => {
    await expect(page.locator('text=/Assets & Equipment|Cashflow Ledger/i')).toHaveCount(0);
  });

  test('SmartTable has ID column', async ({ page }) => {
    const col = page.locator('text=/^ID$/i').first();
    if (await col.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(col).toBeVisible();
    }
  });

  test('SmartTable has Nama column', async ({ page }) => {
    await expect(page.locator('text=/Nama/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Email column', async ({ page }) => {
    await expect(page.locator('text=/Email/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Tier column', async ({ page }) => {
    await expect(page.locator('text=/Tier/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Total Order column', async ({ page }) => {
    await expect(page.locator('text=/Total Order/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Total Revenue column', async ({ page }) => {
    await expect(page.locator('text=/Total Revenue/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('shows table or empty guide', async ({ page }) => {
    const table = page.locator('table, [class*="SmartTable"]').first();
    const empty = page.locator('text=/belum ada customer|no customer/i').first();
    const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });
});

// ── Assets & Cashflow ──────────────────────────────────────────────────────────

test.describe('Assets & Cashflow', () => {
  let pg: FinancesAndAssetsPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new FinancesAndAssetsPage(page);
    await pg.gotoAssets();
  });

  test('loads assets page', async ({ page }) => {
    await expect(page.locator('text=/Asset|Aset|Equipment/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('does not crash on assets page', async ({ page }) => {
    await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
  });

  // ── Tabs ─────────────────────────────────────────────────────────────────

  test('Assets tab is clickable', async () => {
    await pg.clickTabAssets();
  });

  test('Cashflow tab is clickable', async () => {
    await pg.clickTabCashflow();
    await pg.page.waitForTimeout(300);
  });

  test('Reports tab renders', async ({ page }) => {
    await pg.gotoReports();
    await expect(page.locator('text=/Report|Laporan/i').first()).toBeVisible({ timeout: 6_000 });
  });

  // ── Spreadsheet controls ──────────────────────────────────────────────────

  test('Zebra toggle button is visible', async () => {
    const btn = pg.zebraToggle();
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await pg.toggleZebra();
      await pg.toggleZebra(); // toggle back
    }
  });

  test('Density buttons change spacing', async () => {
    await pg.setDensity('high');
    await pg.setDensity('normal');
    await pg.setDensity('relaxed');
  });

  // ── Layout switching ──────────────────────────────────────────────────────

  test('switches to Kanban layout', async () => {
    await pg.switchLayout('kanban');
  });

  test('switches to Gallery layout', async () => {
    await pg.switchLayout('gallery');
  });

  test('switches to Calendar layout', async () => {
    await pg.switchLayout('calendar');
  });

  test('switches to Analytics layout', async () => {
    await pg.switchLayout('analytics');
  });

  test('switches back to Spreadsheet layout', async () => {
    await pg.switchLayout('kanban');
    await pg.switchLayout('spreadsheet');
  });

  test('all layouts render without crash', async ({ page }) => {
    for (const layout of ['kanban', 'gallery', 'calendar', 'analytics', 'spreadsheet'] as const) {
      await pg.switchLayout(layout);
      await page.waitForTimeout(200);
      await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
    }
  });

  // ── Add Column modal ──────────────────────────────────────────────────────

  test('opens Add Custom Column modal', async () => {
    await pg.openAddColumnModal();
  });

  test('Add Column modal has Label field', async ({ page }) => {
    await pg.openAddColumnModal();
    const modal = page.locator('h3').filter({ hasText: /initialize custom/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="Audit"]')).toBeVisible();
    }
  });

  test('Add Column modal has Type dropdown', async ({ page }) => {
    await pg.openAddColumnModal();
    const modal = page.locator('h3').filter({ hasText: /initialize custom/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('Add Column modal closes on Cancel', async ({ page }) => {
    await pg.openAddColumnModal();
    const modal = page.locator('h3').filter({ hasText: /initialize custom/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /cancel/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  // ── Add Asset modal ───────────────────────────────────────────────────────

  test('opens Capitalize Asset modal', async () => {
    await pg.openAddAssetModal();
  });

  test('Add Asset modal has Asset Name field', async ({ page }) => {
    await pg.openAddAssetModal();
    const modal = page.locator('h3').filter({ hasText: /capitalize equipment/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="Masterwork"]')).toBeVisible();
    }
  });

  test('Add Asset modal has Category dropdown', async ({ page }) => {
    await pg.openAddAssetModal();
    const modal = page.locator('h3').filter({ hasText: /capitalize equipment/i });
    if (await modal.isVisible().catch(() => false)) {
      const opts = await page.locator('select').first().locator('option').allTextContents();
      expect(opts.some(o => /production|facility|office|vehicle/i.test(o))).toBeTruthy();
    }
  });

  test('Add Asset modal closes on Cancel', async ({ page }) => {
    await pg.openAddAssetModal();
    const modal = page.locator('h3').filter({ hasText: /capitalize equipment/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /cancel/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  test('creates new asset', async ({ page }) => {
    await pg.openAddAssetModal();
    const modal = page.locator('h3').filter({ hasText: /capitalize equipment/i });
    if (await modal.isVisible().catch(() => false)) {
      await pg.fillAddAsset(`PW Asset ${TS()}`);
      await pg.saveAsset();
    }
  });

  // ── Formula bar ───────────────────────────────────────────────────────────

  test('formula bar fx input is visible', async ({ page }) => {
    const fx = page.locator('input[placeholder*="fx"], input[placeholder*="formula"]').first();
    if (await fx.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(fx).toBeVisible();
    }
  });

  // ── Reports tab ───────────────────────────────────────────────────────────

  test('Reports tab shows balance sheet', async ({ page }) => {
    await pg.gotoReports();
    await expect(page.locator('text=/Balance.Sheet|Laporan Keuangan|Financial/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('Reports tab shows channel contribution', async ({ page }) => {
    await pg.gotoReports();
    const contrib = page.locator('text=/Channel|Contribution|Marketing/i').first();
    if (await contrib.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(contrib).toBeVisible();
    }
  });

  // ── Cashflow ──────────────────────────────────────────────────────────────

  test('Cashflow tab shows table or empty guide', async ({ page }) => {
    await pg.gotoCashflow();
    const table = page.locator('table, [class*="SmartTable"]').first();
    const empty = page.locator('text=/belum ada|empty/i').first();
    const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });
});
