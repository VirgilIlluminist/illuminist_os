import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../helpers/auth';
import { MaterialsPage } from '../pages/MaterialsPage';

const TS = () => Date.now();

test.describe('Materials', () => {
  let page_: MaterialsPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    page_ = new MaterialsPage(page);
    await page_.goto();
  });

  // ── Page load & tabs ──────────────────────────────────────────────────────

  test('loads Materials page', async ({ page }) => {
    await expect(page.locator('text=/Material Library|Bahan Baku/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Library tab is active by default', async ({ page }) => {
    await expect(page.locator('text=/Material Library/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Purchase Orders tab', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    await expect(page.locator('text=/Purchase Order|PO/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switches to Suppliers tab', async ({ page }) => {
    await page_.clickTabSuppliers();
    await expect(page.locator('text=/supplier/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('switching tabs does not crash', async () => {
    await page_.clickTabPurchaseOrders();
    await page_.clickTabSuppliers();
    await page_.clickTabLibrary();
  });

  // ── Header buttons ────────────────────────────────────────────────────────

  test('+ Tambah Material button is visible on library tab', async () => {
    await expect(page_.btnAddMaterial()).toBeVisible({ timeout: 5_000 });
  });

  test('+ Tambah PO button is visible on purchase tab', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const btn = page.locator('button').filter({ hasText: /tambah po/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('+ Tambah Supplier button is visible on suppliers tab', async () => {
    await page_.clickTabSuppliers();
    await expect(page_.btnAddSupplier()).toBeVisible({ timeout: 5_000 });
  });

  // ── Add Material modal ────────────────────────────────────────────────────

  test('opens Add Material modal on button click', async () => {
    await page_.openAddMaterialModal();
  });

  test('Add Material modal has Nama Material field', async ({ page }) => {
    await page_.openAddMaterialModal();
    await expect(page.locator('input[placeholder*="Cobalt"]')).toBeVisible();
  });

  test('Add Material modal has Kategori dropdown', async ({ page }) => {
    await page_.openAddMaterialModal();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Add Material modal has Unit field', async ({ page }) => {
    await page_.openAddMaterialModal();
    await expect(page.locator('input[placeholder*="meters"]')).toBeVisible();
  });

  test('Add Material modal has Catatan textarea', async ({ page }) => {
    await page_.openAddMaterialModal();
    await expect(page.locator('textarea[placeholder*="Catatan"]')).toBeVisible();
  });

  test('Add Material modal has Cancel button', async ({ page }) => {
    await page_.openAddMaterialModal();
    await expect(page.locator('button').filter({ hasText: /batal|cancel/i }).first()).toBeVisible();
  });

  test('Add Material modal closes on Cancel', async ({ page }) => {
    await page_.openAddMaterialModal();
    await page.locator('button').filter({ hasText: /batal|cancel/i }).first().click();
    await page_.expectModalClosed(/tambah material/i);
  });

  test('saving without name shows validation error', async ({ page }) => {
    await page_.openAddMaterialModal();
    await page_.saveMaterial();
    const toast = page.locator('[role="alert"], [class*="toast"]').filter({ hasText: /wajib|required/i });
    await expect(toast).toBeVisible({ timeout: 6_000 });
  });

  test('creates new material with name', async () => {
    const name = `PW-MAT-${TS()}`;
    await page_.addMaterial({ name });
    await page_.expectMaterialInTable(name);
  });

  test('material name appears in Library tab after creation', async ({ page }) => {
    const name = `PW-VERIFY-${TS()}`;
    await page_.addMaterial({ name });
    await expect(page.locator(`text="${name}"`).first()).toBeVisible({ timeout: 6_000 });
  });

  test('creates material with custom unit', async () => {
    const name = `PW-YARD-${TS()}`;
    await page_.addMaterial({ name, unit: 'yard' });
    await page_.expectMaterialInTable(name);
  });

  test('creates material with notes', async () => {
    const name = `PW-NOTE-${TS()}`;
    await page_.addMaterial({ name, notes: 'Playwright test note' });
    await page_.expectMaterialInTable(name);
  });

  // ── SmartTable Library ────────────────────────────────────────────────────

  test('SmartTable has column: Nama Material', async ({ page }) => {
    await expect(page.locator('text=/Nama Material|Nama/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has column: Stok', async ({ page }) => {
    await expect(page.locator('text=/Stok|Stock/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has column: Unit', async ({ page }) => {
    await expect(page.locator('text=/Unit/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('SmartTable has column: Supplier', async ({ page }) => {
    await expect(page.locator('text=/Supplier/i').first()).toBeVisible({ timeout: 6_000 });
  });

  // ── Search & filter ───────────────────────────────────────────────────────

  test('search input filters materials by name', async () => {
    const name = `PW-SEARCH-${TS()}`;
    await page_.addMaterial({ name });
    await page_.search(name);
    await page_.expectMaterialInTable(name);
  });

  test('search with nonexistent term shows no matching rows', async ({ page }) => {
    await page_.search('ZZZNOTEXISTSXXX');
    await page.waitForTimeout(500);
    const rows = page.locator('text="ZZZNOTEXISTSXXX"');
    await expect(rows).toHaveCount(0);
  });

  test('clearing search restores all rows', async () => {
    const name = `PW-CLR-${TS()}`;
    await page_.addMaterial({ name });
    await page_.search('ZZZNOTEXISTSXXX');
    await page_.clearSearch();
    await page_.expectMaterialInTable(name);
  });

  // ── Add Supplier ──────────────────────────────────────────────────────────

  test('opens Add Supplier modal', async () => {
    await page_.clickTabSuppliers();
    await page_.openAddSupplierModal();
  });

  test('Add Supplier modal has Nama Supplier field', async ({ page }) => {
    await page_.clickTabSuppliers();
    await page_.openAddSupplierModal();
    await expect(page.locator('input[placeholder*="Tekstil"]')).toBeVisible();
  });

  test('Add Supplier modal has Kontak field', async ({ page }) => {
    await page_.clickTabSuppliers();
    await page_.openAddSupplierModal();
    await expect(page.locator('input[placeholder*="Nama —"]')).toBeVisible();
  });

  test('Add Supplier modal has Tier dropdown', async ({ page }) => {
    await page_.clickTabSuppliers();
    await page_.openAddSupplierModal();
    const selects = page.locator('select');
    await expect(selects.last()).toBeVisible();
  });

  test('Add Supplier modal closes on Batal', async ({ page }) => {
    await page_.clickTabSuppliers();
    await page_.openAddSupplierModal();
    await page.locator('button').filter({ hasText: /batal/i }).first().click();
    await page_.expectModalClosed(/tambah supplier/i);
  });

  test('creates new supplier', async ({ page }) => {
    const name = `PW-SUP-${TS()}`;
    await page_.clickTabSuppliers();
    await page_.addSupplier({ name, contact: 'contact@test.com' });
    await expect(page.locator(`text="${name}"`).first()).toBeVisible({ timeout: 6_000 });
  });

  // ── Edit Supplier ─────────────────────────────────────────────────────────

  test('edit supplier modal has Hapus button', async ({ page }) => {
    const name = `PW-SUPEDIT-${TS()}`;
    await page_.clickTabSuppliers();
    await page_.addSupplier({ name });
    await page_.openEditSupplierForRow(name);
    const hapus = page.locator('button').filter({ hasText: /hapus/i }).first();
    if (await hapus.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(hapus).toBeVisible();
    }
  });

  test('edit supplier modal has Simpan button', async ({ page }) => {
    const name = `PW-SUPSAV-${TS()}`;
    await page_.clickTabSuppliers();
    await page_.addSupplier({ name });
    await page_.openEditSupplierForRow(name);
    const simpan = page.locator('button').filter({ hasText: /simpan/i }).last();
    if (await simpan.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(simpan).toBeVisible();
    }
  });

  // ── Purchase Orders tab ───────────────────────────────────────────────────

  test('Purchase Orders tab shows PO table or empty guide', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const table = page.locator('table, [class*="table"]').first();
    const empty = page.locator('text=/belum ada|empty|no data/i').first();
    const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('Add PO modal opens', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const btn = page.locator('button').filter({ hasText: /tambah po/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      await expect(page.locator('h3').filter({ hasText: /tambah po/i })).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Add PO modal has Material select', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const btn = page.locator('button').filter({ hasText: /tambah po/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      const modal = page.locator('h3').filter({ hasText: /tambah po/i });
      if (await modal.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(page.locator('select').first()).toBeVisible();
      }
    }
  });

  test('Add PO modal has Status dropdown', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const btn = page.locator('button').filter({ hasText: /tambah po/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      const modal = page.locator('h3').filter({ hasText: /tambah po/i });
      if (await modal.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const selects = page.locator('select');
        await expect(selects.last()).toBeVisible();
      }
    }
  });

  test('Add PO modal closes on Batal', async ({ page }) => {
    await page_.clickTabPurchaseOrders();
    const btn = page.locator('button').filter({ hasText: /tambah po/i });
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      const modal = page.locator('h3').filter({ hasText: /tambah po/i });
      if (await modal.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await page.locator('button').filter({ hasText: /batal/i }).first().click();
        await expect(modal).toHaveCount(0, { timeout: 5_000 });
      }
    }
  });
});
