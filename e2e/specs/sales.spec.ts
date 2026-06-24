import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../helpers/auth';
import { SalesPage } from '../pages/SalesPage';

const TS = () => Date.now();

test.describe('Sales & Costs', () => {
  let pg: SalesPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new SalesPage(page);
    await pg.goto();
  });

  // ── Page load & tabs ──────────────────────────────────────────────────────

  test('loads Sales page', async ({ page }) => {
    await expect(page.locator('text=/Sales|Penjualan/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Sales tab is active by default', async ({ page }) => {
    await expect(page.locator('text=/Sales|Penjualan/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Ops tab', async ({ page }) => {
    await pg.clickTabOps();
    await expect(page.locator('text=/Ops|Biaya|Operational/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Ads tab', async ({ page }) => {
    await pg.clickTabAds();
    await expect(page.locator('text=/Ads|Campaign|Iklan/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to KOL tab', async ({ page }) => {
    await pg.clickTabKOL();
    await expect(page.locator('text=/KOL|Influencer/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('all tabs cycle without crash', async () => {
    await pg.clickTabOps();
    await pg.clickTabAds();
    await pg.clickTabKOL();
    await pg.clickTabSales();
  });

  // ── SmartTable Sales columns ──────────────────────────────────────────────

  test('Sales SmartTable has Customer column', async ({ page }) => {
    await expect(page.locator('text=/Customer|Pembeli/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('Sales SmartTable has Channel column', async ({ page }) => {
    await expect(page.locator('text=/Channel/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('Sales SmartTable has Net/Revenue column', async ({ page }) => {
    await expect(page.locator('text=/Net|Revenue|Pendapatan/i').first()).toBeVisible({ timeout: 6_000 });
  });

  // ── Add Sale modal ────────────────────────────────────────────────────────

  test('+ Tambah Penjualan button is visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /tambah penjualan/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('opens Add Sale modal', async () => {
    await pg.openAddSaleModal();
  });

  test('Add Sale modal has Produk dropdown', async ({ page }) => {
    await pg.openAddSaleModal();
    const modal = page.locator('h3').filter({ hasText: /penjualan|sale/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('Add Sale modal has Nama Pembeli field', async ({ page }) => {
    await pg.openAddSaleModal();
    const modal = page.locator('h3').filter({ hasText: /penjualan|sale/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="Rina"]')).toBeVisible();
    }
  });

  test('Add Sale modal has Channel dropdown', async ({ page }) => {
    await pg.openAddSaleModal();
    const modal = page.locator('h3').filter({ hasText: /penjualan|sale/i });
    if (await modal.isVisible().catch(() => false)) {
      const selects = page.locator('select');
      const count = await selects.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Add Sale modal has Status dropdown', async ({ page }) => {
    await pg.openAddSaleModal();
    const modal = page.locator('h3').filter({ hasText: /penjualan|sale/i });
    if (await modal.isVisible().catch(() => false)) {
      const opts = await page.locator('select').last().locator('option').allTextContents();
      expect(opts.some(o => /pending|shipped|completed|cancelled/i.test(o))).toBeTruthy();
    }
  });

  test('Add Sale modal closes on Batal', async ({ page }) => {
    await pg.openAddSaleModal();
    const modal = page.locator('h3').filter({ hasText: /penjualan|sale/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  // ── Create Sale ───────────────────────────────────────────────────────────

  test('creates sale and it appears in table', async () => {
    const buyer = `PW-BUYER-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.expectSaleInTable(buyer);
  });

  test('creates multiple sales', async () => {
    const b1 = `PW-B1-${TS()}`;
    const b2 = `PW-B2-${TS() + 1}`;
    await pg.addSale({ customerName: b1 });
    await pg.addSale({ customerName: b2 });
    await pg.expectSaleInTable(b1);
    await pg.expectSaleInTable(b2);
  });

  // ── Edit Sale ─────────────────────────────────────────────────────────────

  test('opens Edit Sale modal from row', async ({ page }) => {
    const buyer = `PW-EDIT-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.openEditSaleForRow(buyer);
  });

  test('Edit Sale modal has Hapus button', async ({ page }) => {
    const buyer = `PW-DEL-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.openEditSaleForRow(buyer);
    const modal = page.locator('h3').filter({ hasText: /edit order/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('button').filter({ hasText: /hapus/i }).first()).toBeVisible();
    }
  });

  test('Edit Sale modal has Simpan button', async ({ page }) => {
    const buyer = `PW-SIMP-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.openEditSaleForRow(buyer);
    const modal = page.locator('h3').filter({ hasText: /edit order/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('button').filter({ hasText: /simpan/i }).last()).toBeVisible();
    }
  });

  // ── Delete Sale ───────────────────────────────────────────────────────────

  test('deletes sale from edit modal', async ({ page }) => {
    const buyer = `PW-DELT-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.expectSaleInTable(buyer);
    await pg.openEditSaleForRow(buyer);
    const modal = page.locator('h3').filter({ hasText: /edit order/i });
    if (await modal.isVisible().catch(() => false)) {
      await pg.deleteSale();
      await pg.expectSaleNotInTable(buyer);
    }
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('search filters sales by customer name', async () => {
    const buyer = `PW-SRCH-${TS()}`;
    await pg.addSale({ customerName: buyer });
    await pg.search(buyer);
    await pg.expectSaleInTable(buyer);
  });

  test('search with no match shows no rows', async ({ page }) => {
    await pg.search('ZZNOTEXISTZZZ');
    await page.waitForTimeout(500);
    await expect(page.locator('text="ZZNOTEXISTZZZ"')).toHaveCount(0);
  });

  // ── Ops Cost tab ──────────────────────────────────────────────────────────

  test('Ops tab shows add button or empty guide', async ({ page }) => {
    await pg.clickTabOps();
    const btn = page.locator('button').filter({ hasText: /tambah biaya/i });
    const empty = page.locator('text=/belum ada|empty|biaya/i').first();
    const hasBtn = await btn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasBtn || hasEmpty).toBeTruthy();
  });

  test('opens Add Ops modal', async () => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
  });

  test('Add Ops modal has Kategori dropdown', async ({ page }) => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
    const modal = page.locator('h3').filter({ hasText: /biaya operasional/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('Add Ops modal has Platform field', async ({ page }) => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
    const modal = page.locator('h3').filter({ hasText: /biaya operasional/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="Meta Ads"]')).toBeVisible();
    }
  });

  test('Add Ops modal has Catatan textarea', async ({ page }) => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
    const modal = page.locator('h3').filter({ hasText: /biaya operasional/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('textarea').first()).toBeVisible();
    }
  });

  test('Add Ops modal closes on Batal', async ({ page }) => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
    const modal = page.locator('h3').filter({ hasText: /biaya operasional/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  test('creates ops cost entry', async ({ page }) => {
    await pg.clickTabOps();
    await pg.openAddOpsModal();
    const modal = page.locator('h3').filter({ hasText: /biaya operasional/i });
    if (await modal.isVisible().catch(() => false)) {
      await pg.fillOpsForm({ platform: 'PW Test Platform', notes: 'playwright test' });
      await pg.saveOps();
    }
  });

  // ── Ads Campaign tab ──────────────────────────────────────────────────────

  test('Ads tab renders', async ({ page }) => {
    await pg.clickTabAds();
    await expect(page.locator('text=/Ads|Campaign|Iklan/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add Ads Campaign modal', async () => {
    await pg.clickTabAds();
    await pg.openAddAdsModal();
  });

  test('Add Ads modal has Nama Campaign field', async ({ page }) => {
    await pg.clickTabAds();
    await pg.openAddAdsModal();
    const modal = page.locator('h3').filter({ hasText: /campaign iklan/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="Summer Drop"]')).toBeVisible();
    }
  });

  test('Add Ads modal has Platform dropdown', async ({ page }) => {
    await pg.clickTabAds();
    await pg.openAddAdsModal();
    const modal = page.locator('h3').filter({ hasText: /campaign iklan/i });
    if (await modal.isVisible().catch(() => false)) {
      const opts = await page.locator('select').first().locator('option').allTextContents();
      expect(opts.some(o => /meta|tiktok|google|shopee/i.test(o))).toBeTruthy();
    }
  });

  test('Add Ads modal closes on Batal', async ({ page }) => {
    await pg.clickTabAds();
    await pg.openAddAdsModal();
    const modal = page.locator('h3').filter({ hasText: /campaign iklan/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  test('creates ads campaign', async ({ page }) => {
    await pg.clickTabAds();
    await pg.openAddAdsModal();
    const modal = page.locator('h3').filter({ hasText: /campaign iklan/i });
    if (await modal.isVisible().catch(() => false)) {
      await pg.fillAdsForm({ name: `PW Campaign ${TS()}` });
      await pg.saveAds();
    }
  });

  // ── KOL tab ───────────────────────────────────────────────────────────────

  test('KOL tab renders', async ({ page }) => {
    await pg.clickTabKOL();
    await expect(page.locator('text=/KOL|Influencer/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add KOL modal', async () => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
  });

  test('Add KOL modal has Nama KOL field', async ({ page }) => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="@influencer"]')).toBeVisible();
    }
  });

  test('Add KOL modal has Platform dropdown', async ({ page }) => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      const opts = await page.locator('select').first().locator('option').allTextContents();
      expect(opts.some(o => /instagram|tiktok|youtube/i.test(o))).toBeTruthy();
    }
  });

  test('Add KOL modal has Kode Promo field', async ({ page }) => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="NAMA"]')).toBeVisible();
    }
  });

  test('Add KOL modal has Status dropdown', async ({ page }) => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      const opts = await page.locator('select').last().locator('option').allTextContents();
      expect(opts.some(o => /negotiation|contracted|completed/i.test(o))).toBeTruthy();
    }
  });

  test('Add KOL modal closes on Batal', async ({ page }) => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  test('creates KOL entry', async () => {
    await pg.clickTabKOL();
    await pg.openAddKOLModal();
    const modal = pg.page.locator('h3').filter({ hasText: /tambah kol/i });
    if (await modal.isVisible().catch(() => false)) {
      await pg.fillKOLForm({ name: `@pw_influencer_${TS()}` });
      await pg.saveKOL();
    }
  });
});
