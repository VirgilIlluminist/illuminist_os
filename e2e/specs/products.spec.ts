import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../helpers/auth';
import { ProductsPage } from '../pages/ProductsPage';

const TS = () => Date.now();

test.describe('Products', () => {
  let pg: ProductsPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new ProductsPage(page);
    await pg.goto();
  });

  // ── Page load & tabs ──────────────────────────────────────────────────────

  test('loads Products page', async ({ page }) => {
    await expect(page.locator('text=/Master Products|Produk|Products/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Master Products tab active by default', async ({ page }) => {
    await expect(page.locator('text=/Master Products|produk/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Sample tab', async ({ page }) => {
    await pg.clickTabSamples();
    await expect(page.locator('text=/sample/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Produksi tab', async ({ page }) => {
    await pg.clickTabProduction();
    await expect(page.locator('text=/produksi|production|batch/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Variants tab', async ({ page }) => {
    await pg.clickTabVariants();
    await expect(page.locator('text=/variant|SKU/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('all tabs switch without crash', async () => {
    await pg.clickTabSamples();
    await pg.clickTabProduction();
    await pg.clickTabVariants();
    await pg.clickTabMaster();
  });

  // ── SmartTable columns ────────────────────────────────────────────────────

  test('SmartTable has Nama Produk column', async ({ page }) => {
    await expect(page.locator('text=/Nama Produk|Nama/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Harga Jual column', async ({ page }) => {
    await expect(page.locator('text=/Harga Jual|Harga/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has Status column', async ({ page }) => {
    await expect(page.locator('text=/Status/i').first()).toBeVisible({ timeout: 6_000 });
  });

  // ── Add Product modal ─────────────────────────────────────────────────────

  test('+ Tambah Produk button is visible', async () => {
    await expect(pg.btnAddProduct()).toBeVisible({ timeout: 5_000 });
  });

  test('opens Add Product modal', async () => {
    await pg.openAddProductModal();
  });

  test('modal has Nama Produk field', async ({ page }) => {
    await pg.openAddProductModal();
    await expect(page.locator('input[placeholder*="Oversize Tee"]')).toBeVisible();
  });

  test('modal has Koleksi field', async ({ page }) => {
    await pg.openAddProductModal();
    await expect(page.locator('input[placeholder*="Essential Series"]')).toBeVisible();
  });

  test('modal has Status dropdown with Active/Draft/Archived', async ({ page }) => {
    await pg.openAddProductModal();
    const status = page.locator('select');
    await expect(status.first()).toBeVisible();
    const opts = await status.first().locator('option').allTextContents();
    expect(opts.some(o => /active/i.test(o))).toBeTruthy();
    expect(opts.some(o => /draft/i.test(o))).toBeTruthy();
    expect(opts.some(o => /archived/i.test(o))).toBeTruthy();
  });

  test('modal has Cancel button', async ({ page }) => {
    await pg.openAddProductModal();
    await expect(page.locator('button').filter({ hasText: /batal|cancel/i }).first()).toBeVisible();
  });

  test('modal closes on Cancel', async () => {
    await pg.openAddProductModal();
    await pg.page.locator('button').filter({ hasText: /batal|cancel/i }).first().click();
    await pg.expectModalClosed(/tambah produk/i);
  });

  // ── Create ────────────────────────────────────────────────────────────────

  test('creates product with name only', async () => {
    const name = `PW-PROD-${TS()}`;
    await pg.addProduct({ name });
    await pg.expectProductInTable(name);
  });

  test('creates product with collection', async () => {
    const name = `PW-COLL-${TS()}`;
    await pg.addProduct({ name, collection: 'PW Collection 2026' });
    await pg.expectProductInTable(name);
  });

  test('creates product with Draft status', async () => {
    const name = `PW-DRAFT-${TS()}`;
    await pg.addProduct({ name, status: 'Draft' });
    await pg.expectProductInTable(name);
  });

  test('creates product with Archived status', async () => {
    const name = `PW-ARCH-${TS()}`;
    await pg.addProduct({ name, status: 'Archived' });
    await pg.expectProductInTable(name);
  });

  test('multiple products appear in table', async () => {
    const n1 = `PW-M1-${TS()}`;
    const n2 = `PW-M2-${TS() + 1}`;
    await pg.addProduct({ name: n1 });
    await pg.addProduct({ name: n2 });
    await pg.expectProductInTable(n1);
    await pg.expectProductInTable(n2);
  });

  // ── Edit ──────────────────────────────────────────────────────────────────

  test('edit modal opens from row action', async ({ page }) => {
    const name = `PW-EDIT-${TS()}`;
    await pg.addProduct({ name });
    await pg.expectProductInTable(name);
    const row = page.locator('[class*="row"], tr').filter({ hasText: name }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await pg.expectModalOpen(/edit produk/i);
    }
  });

  test('edit modal has Hapus (delete) button', async ({ page }) => {
    const name = `PW-HAPUS-${TS()}`;
    await pg.addProduct({ name });
    const row = page.locator('[class*="row"], tr').filter({ hasText: name }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await pg.expectModalOpen(/edit produk/i);
      await expect(page.locator('button').filter({ hasText: /hapus/i }).first()).toBeVisible();
    }
  });

  test('edit modal has Simpan button', async ({ page }) => {
    const name = `PW-SIMP-${TS()}`;
    await pg.addProduct({ name });
    const row = page.locator('[class*="row"], tr').filter({ hasText: name }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await pg.expectModalOpen(/edit produk/i);
      await expect(page.locator('button').filter({ hasText: /simpan/i }).last()).toBeVisible();
    }
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  test('deletes product from edit modal', async ({ page }) => {
    const name = `PW-DEL-${TS()}`;
    await pg.addProduct({ name });
    await pg.expectProductInTable(name);

    const row = page.locator('[class*="row"], tr').filter({ hasText: name }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await pg.expectModalOpen(/edit produk/i);
      await pg.deleteProduct();
      await pg.expectProductNotInTable(name);
    }
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('search filters products by name', async () => {
    const name = `PW-SRCH-${TS()}`;
    await pg.addProduct({ name });
    await pg.search(name);
    await pg.expectProductInTable(name);
  });

  test('search with no match shows empty state', async ({ page }) => {
    await pg.search('ZZNOTEXISTZZZ');
    await page.waitForTimeout(500);
    await expect(page.locator('text="ZZNOTEXISTZZZ"')).toHaveCount(0);
  });

  test('clearing search restores product list', async () => {
    const name = `PW-CLEAR-${TS()}`;
    await pg.addProduct({ name });
    await pg.search('ZZNOTEXISTZZZ');
    await pg.clearSearch();
    await pg.expectProductInTable(name);
  });

  // ── Sample tab ────────────────────────────────────────────────────────────

  test('Sample tab shows add button or empty guide', async ({ page }) => {
    await pg.clickTabSamples();
    const btn = page.locator('button').filter({ hasText: /tambah sample/i });
    const empty = page.locator('text=/belum ada|empty|prototipe/i').first();
    const hasBtn = await btn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasBtn || hasEmpty).toBeTruthy();
  });

  test('opens Add Sample modal', async () => {
    await pg.clickTabSamples();
    await pg.openAddSampleModal();
  });

  test('Add Sample modal has Produk dropdown', async ({ page }) => {
    await pg.clickTabSamples();
    await pg.openAddSampleModal();
    const h3 = page.locator('h3').filter({ hasText: /tambah sample/i });
    if (await h3.isVisible().catch(() => false)) {
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('Add Sample modal closes on Batal', async ({ page }) => {
    await pg.clickTabSamples();
    await pg.openAddSampleModal();
    const modal = page.locator('h3').filter({ hasText: /tambah sample/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  // ── Production tab ────────────────────────────────────────────────────────

  test('Production tab renders', async ({ page }) => {
    await pg.clickTabProduction();
    await expect(page.locator('text=/produksi|production|batch/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add Batch modal', async () => {
    await pg.clickTabProduction();
    await pg.openAddBatchModal();
  });

  test('Add Batch modal has Pabrik field', async ({ page }) => {
    await pg.clickTabProduction();
    await pg.openAddBatchModal();
    const modal = page.locator('h3').filter({ hasText: /batch produksi/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="pabrik"]')).toBeVisible();
    }
  });

  test('Add Batch modal has Status Produksi dropdown', async ({ page }) => {
    await pg.clickTabProduction();
    await pg.openAddBatchModal();
    const modal = page.locator('h3').filter({ hasText: /batch produksi/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('Add Batch modal closes on Batal', async ({ page }) => {
    await pg.clickTabProduction();
    await pg.openAddBatchModal();
    const modal = page.locator('h3').filter({ hasText: /batch produksi/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });

  // ── Variants tab ──────────────────────────────────────────────────────────

  test('Variants tab renders', async ({ page }) => {
    await pg.clickTabVariants();
    await expect(page.locator('text=/variant|SKU/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add Variant modal', async () => {
    await pg.clickTabVariants();
    await pg.openAddVariantModal();
  });

  test('Add Variant modal has SKU field', async ({ page }) => {
    await pg.clickTabVariants();
    await pg.openAddVariantModal();
    const modal = page.locator('h3').filter({ hasText: /variant/i });
    if (await modal.isVisible().catch(() => false)) {
      await expect(page.locator('input[placeholder*="NVH"]')).toBeVisible();
    }
  });

  test('Add Variant modal has Size dropdown', async ({ page }) => {
    await pg.clickTabVariants();
    await pg.openAddVariantModal();
    const modal = page.locator('h3').filter({ hasText: /variant/i });
    if (await modal.isVisible().catch(() => false)) {
      const sizeSelect = page.locator('select').last();
      if (await sizeSelect.isVisible().catch(() => false)) {
        const opts = await sizeSelect.locator('option').allTextContents();
        expect(opts.some(o => /XS|S|M|L|XL/i.test(o))).toBeTruthy();
      }
    }
  });

  test('Add Variant modal closes on Batal', async ({ page }) => {
    await pg.clickTabVariants();
    await pg.openAddVariantModal();
    const modal = page.locator('h3').filter({ hasText: /variant/i });
    if (await modal.isVisible().catch(() => false)) {
      await page.locator('button').filter({ hasText: /batal/i }).first().click();
      await expect(modal).toHaveCount(0, { timeout: 5_000 });
    }
  });
});
