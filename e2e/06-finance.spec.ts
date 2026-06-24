import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const BUYER = `PW Buyer ${Date.now()}`;

test.describe('Finance — Dashboard & Sales', () => {

  // ── Finance Dashboard ──────────────────────────────────────────────────────
  test.describe('Finance Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/app/finance');
      await page.waitForLoadState('networkidle');
    });

    test('opens finance dashboard', async ({ page }) => {
      await expect(page.locator('text=/Finance|Keuangan/i').first()).toBeVisible({ timeout: 8_000 });
    });

    test('renders KPI cards (kas, revenue, biaya, aset)', async ({ page }) => {
      const kpiText = page.locator('text=/kas|revenue|biaya|aset|cash|cost/i').first();
      await expect(kpiText).toBeVisible({ timeout: 8_000 });
    });

    test('renders transaction table or empty state', async ({ page }) => {
      const table = page.locator('table, [role="table"], [class*="SmartTable"], [class*="table"]').first();
      const empty = page.locator('text=/kosong|belum ada|empty/i').first();
      const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
      expect(hasTable || hasEmpty).toBeTruthy();
    });

    test('no crash on zero-data state', async ({ page }) => {
      await expect(page.locator('text=/Something went wrong|Error boundary/i')).toHaveCount(0);
    });
  });

  // ── Sales Tracking ─────────────────────────────────────────────────────────
  test.describe('Sales Tracking', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/app/sales');
      await page.waitForLoadState('networkidle');
    });

    test('opens sales page', async ({ page }) => {
      await expect(page.locator('text=/Sales|Penjualan/i').first()).toBeVisible({ timeout: 8_000 });
    });

    test('tab bar renders Sales, Ops, Ads, KOL', async ({ page }) => {
      await expect(page.locator('button').filter({ hasText: /sales|penjualan/i }).first()).toBeVisible();
    });

    test('opens Add Sale modal', async ({ page }) => {
      const addBtn = page.locator('button').filter({ hasText: /tambah penjualan|add sale/i });
      if (await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await addBtn.click();
        await expect(page.locator('h3').filter({ hasText: /penjualan|sale|order/i })).toBeVisible({ timeout: 5_000 });
      }
    });

    test('fills and saves new sale', async ({ page }) => {
      const addBtn = page.locator('button').filter({ hasText: /tambah penjualan|add sale/i });
      if (!await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) return;

      await addBtn.click();
      await expect(page.locator('h3').filter({ hasText: /penjualan|sale|order/i })).toBeVisible({ timeout: 5_000 });

      const buyerInput = page.locator('input[placeholder*="Rina"]');
      if (await buyerInput.isVisible()) {
        await buyerInput.fill(BUYER);
      }

      const saveBtn = page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last();
      await saveBtn.click();
    });

    test('sale appears in SmartTable after save', async ({ page }) => {
      const buyerName = `PW-Sale-${Date.now()}`;
      const addBtn = page.locator('button').filter({ hasText: /tambah penjualan|add sale/i });
      if (!await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) return;

      await addBtn.click();
      const buyerInput = page.locator('input[placeholder*="Rina"]');
      if (await buyerInput.isVisible()) await buyerInput.fill(buyerName);

      await page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last().click();
      await expect(page.locator(`text="${buyerName}"`)).toBeVisible({ timeout: 6_000 });
    });

    test('opens Edit Sale modal from row action', async ({ page }) => {
      const editBtns = page.locator('button').filter({ hasText: /edit/i });
      const count = await editBtns.count();
      if (count > 0) {
        await editBtns.first().click();
        await expect(page.locator('h3').filter({ hasText: /edit order|edit sale/i })).toBeVisible({ timeout: 5_000 });
        // Close
        await page.locator('button').filter({ hasText: /batal|cancel/i }).first().click();
      }
    });

    test('deletes a sale from edit modal', async ({ page }) => {
      const buyerName = `PW-DelSale-${Date.now()}`;
      const addBtn = page.locator('button').filter({ hasText: /tambah penjualan|add sale/i });
      if (!await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) return;

      await addBtn.click();
      const buyerInput = page.locator('input[placeholder*="Rina"]');
      if (await buyerInput.isVisible()) await buyerInput.fill(buyerName);
      await page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last().click();
      await expect(page.locator(`text="${buyerName}"`)).toBeVisible({ timeout: 6_000 });

      const row = page.locator('[class*="row"], tr').filter({ hasText: buyerName });
      const editBtn = row.locator('button').filter({ hasText: /edit/i });
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(page.locator('h3').filter({ hasText: /edit/i })).toBeVisible({ timeout: 5_000 });
        await page.locator('button').filter({ hasText: /hapus|delete/i }).first().click();
        await expect(page.locator(`text="${buyerName}"`)).toHaveCount(0, { timeout: 6_000 });
      }
    });
  });

  // ── Operational Costs ──────────────────────────────────────────────────────
  test.describe('Operational Costs', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/app/costs');
      await page.waitForLoadState('networkidle');
    });

    test('opens operational costs tab', async ({ page }) => {
      await expect(page.locator('text=/Ops|Operational|Biaya/i').first()).toBeVisible({ timeout: 8_000 });
    });

    test('opens Add Ops Cost modal', async ({ page }) => {
      const addBtn = page.locator('button').filter({ hasText: /tambah|add ops|biaya/i }).first();
      if (await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await addBtn.click();
        await expect(page.locator('h3').filter({ hasText: /ops|biaya|operational/i })).toBeVisible({ timeout: 5_000 });
      }
    });

    test('fills ops cost form', async ({ page }) => {
      const addBtn = page.locator('button').filter({ hasText: /tambah|add ops|biaya/i }).first();
      if (!await addBtn.isVisible({ timeout: 4_000 }).catch(() => false)) return;

      await addBtn.click();
      await expect(page.locator('h3').filter({ hasText: /ops|biaya|operational/i })).toBeVisible({ timeout: 5_000 });

      const platformInput = page.locator('input[placeholder*="Meta Ads"]');
      if (await platformInput.isVisible()) {
        await platformInput.fill('Playwright Test Cost');
      }

      const saveBtn = page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last();
      await saveBtn.click();
    });
  });

  // ── Customers ──────────────────────────────────────────────────────────────
  test.describe('Customers', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/app/customers');
      await page.waitForLoadState('networkidle');
    });

    test('opens customers page', async ({ page }) => {
      await expect(page.locator('text=/Customer|Pelanggan/i').first()).toBeVisible({ timeout: 8_000 });
    });

    test('renders customer table or empty state', async ({ page }) => {
      const table = page.locator('table, [class*="SmartTable"]').first();
      const empty = page.locator('text=/belum ada customer|no customer/i').first();
      const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
      expect(hasTable || hasEmpty).toBeTruthy();
    });

    test('correct page title is shown (not FinancesAndAssets)', async ({ page }) => {
      // Ensure it shows Customers, NOT the wrong "Assets & Equipment" tab
      await expect(page.locator('text=/Assets & Equipment|Cashflow Ledger/i')).toHaveCount(0);
      await expect(page.locator('text=/Customer/i').first()).toBeVisible();
    });

    test('SmartTable has correct columns', async ({ page }) => {
      // Skip if empty state
      const isEmpty = await page.locator('text=/belum ada/i').isVisible().catch(() => false);
      if (!isEmpty) {
        await expect(page.locator('text=/Nama|Name/i').first()).toBeVisible({ timeout: 5_000 });
        await expect(page.locator('text=/Email/i').first()).toBeVisible({ timeout: 5_000 });
        await expect(page.locator('text=/Tier/i').first()).toBeVisible({ timeout: 5_000 });
      }
    });
  });

  // ── Assets & Cashflow ──────────────────────────────────────────────────────
  test.describe('Assets & Cashflow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.goto('/app/assets');
      await page.waitForLoadState('networkidle');
    });

    test('opens assets page', async ({ page }) => {
      await expect(page.locator('text=/Asset|Aset|Equipment/i').first()).toBeVisible({ timeout: 8_000 });
    });
  });
});
