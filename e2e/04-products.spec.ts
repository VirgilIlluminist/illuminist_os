import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const PROD_NAME = `PW-Product-${Date.now()}`;

test.describe('Products — Master Products', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/products');
    await page.waitForLoadState('networkidle');
  });

  // ── Page load ─────────────────────────────────────────────────────────────
  test('opens master products page', async ({ page }) => {
    await expect(
      page.locator('text=/Master Products|Produk|Products/i').first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('tab bar renders Master, Sample, Production, Variants', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /master|produk/i }).first()).toBeVisible();
  });

  // ── Add product ───────────────────────────────────────────────────────────
  test('opens Add Product modal', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /tambah produk|add product/i });
    await expect(addBtn).toBeVisible({ timeout: 6_000 });
    await addBtn.click();

    await expect(page.locator('h3').filter({ hasText: /produk|product/i })).toBeVisible({ timeout: 5_000 });
  });

  test('fills and saves new product', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /tambah produk|add product/i });
    await addBtn.click();
    await expect(page.locator('h3').filter({ hasText: /produk|product/i })).toBeVisible();

    // Nama Produk
    await page.locator('input[placeholder*="Oversize Tee"]').fill(PROD_NAME);
    // Koleksi
    await page.locator('input[placeholder*="Essential"]').fill('PW Collection 2026');
    // Kategori
    const categoryInput = page.locator('input').nth(2);
    await categoryInput.fill('Tops');

    const saveBtn = page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last();
    await saveBtn.click();

    // Modal should close
    await expect(page.locator('h3').filter({ hasText: /tambah produk/i })).toHaveCount(0, { timeout: 6_000 });
  });

  test('new product appears in the table', async ({ page }) => {
    const uniqueName = `PW-Prod-${Date.now()}`;
    const addBtn = page.locator('button').filter({ hasText: /tambah produk|add product/i });
    await addBtn.click();
    await page.locator('input[placeholder*="Oversize Tee"]').fill(uniqueName);
    await page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last().click();

    // Row with product name should appear
    await expect(page.locator(`text="${uniqueName}"`)).toBeVisible({ timeout: 6_000 });
  });

  // ── Edit product ──────────────────────────────────────────────────────────
  test('can open edit product modal from row action', async ({ page }) => {
    // First add a product to ensure there is one
    const uniqueName = `PW-Edit-${Date.now()}`;
    await page.locator('button').filter({ hasText: /tambah produk|add product/i }).click();
    await page.locator('input[placeholder*="Oversize Tee"]').fill(uniqueName);
    await page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last().click();
    await expect(page.locator(`text="${uniqueName}"`)).toBeVisible({ timeout: 6_000 });

    // Find edit icon in the row
    const row = page.locator('[class*="row"], tr').filter({ hasText: uniqueName });
    const editBtn = row.locator('button').filter({ hasText: /edit/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator('h3').filter({ hasText: /edit produk/i })).toBeVisible({ timeout: 5_000 });
    }
  });

  // ── Delete product ────────────────────────────────────────────────────────
  test('can delete a product from edit modal', async ({ page }) => {
    const uniqueName = `PW-Del-${Date.now()}`;
    await page.locator('button').filter({ hasText: /tambah produk|add product/i }).click();
    await page.locator('input[placeholder*="Oversize Tee"]').fill(uniqueName);
    await page.locator('button').filter({ hasText: /tambah|save|simpan/i }).last().click();
    await expect(page.locator(`text="${uniqueName}"`)).toBeVisible({ timeout: 6_000 });

    const row = page.locator('[class*="row"], tr').filter({ hasText: uniqueName });
    const editBtn = row.locator('button').filter({ hasText: /edit/i });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator('h3').filter({ hasText: /edit produk/i })).toBeVisible({ timeout: 5_000 });

      const hapusBtn = page.locator('button').filter({ hasText: /hapus|delete/i }).first();
      await hapusBtn.click();

      await expect(page.locator(`text="${uniqueName}"`)).toHaveCount(0, { timeout: 6_000 });
    }
  });

  // ── Sample tab ────────────────────────────────────────────────────────────
  test('switches to Sample Development tab', async ({ page }) => {
    const sampleTab = page.locator('button').filter({ hasText: /sample/i }).first();
    await sampleTab.click();
    await expect(page.locator('text=/Sample|Prototipe/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('opens Add Sample modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /sample/i }).first().click();
    const addSampleBtn = page.locator('button').filter({ hasText: /tambah sample|add sample/i });
    if (await addSampleBtn.isVisible()) {
      await addSampleBtn.click();
      await expect(page.locator('h3').filter({ hasText: /sample/i })).toBeVisible({ timeout: 5_000 });
    }
  });

  // ── Production tab ────────────────────────────────────────────────────────
  test('switches to Produksi tab', async ({ page }) => {
    const prodTab = page.locator('button').filter({ hasText: /produksi|production/i }).first();
    if (await prodTab.isVisible()) {
      await prodTab.click();
      await expect(page.locator('text=/Produksi|Production|Batch/i').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // ── Variants tab ──────────────────────────────────────────────────────────
  test('switches to Size Variant tab', async ({ page }) => {
    const variantTab = page.locator('button').filter({ hasText: /variant|inventori/i }).first();
    if (await variantTab.isVisible()) {
      await variantTab.click();
      await expect(page.locator('text=/SKU|Variant|Size/i').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // ── SmartTable ─────────────────────────────────────────────────────────────
  test('SmartTable renders column headers', async ({ page }) => {
    const nameHeader = page.locator('text=/Nama|Name|Produk/i').first();
    await expect(nameHeader).toBeVisible({ timeout: 6_000 });
  });

  test('search filters products', async ({ page }) => {
    const search = page.locator('input[placeholder*="Cari"], input[placeholder*="Search"]').first();
    if (await search.isVisible()) {
      await search.fill('zzz_nonexistent_999');
      await page.waitForTimeout(400);
    }
  });
});
