import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const UNIQUE = `PW-MAT-${Date.now()}`;

test.describe('Inventory — Material Library', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/materials');
    await page.waitForLoadState('networkidle');
  });

  // ── Page load ─────────────────────────────────────────────────────────────
  test('opens material library page', async ({ page }) => {
    await expect(page.locator('text=/Material Library|Bahan Baku|Material/i').first()).toBeVisible();
  });

  test('tab bar renders with Library, Purchase Orders, Suppliers', async ({ page }) => {
    const tabs = page.locator('button').filter({ hasText: /Library|Purchase|Supplier/i });
    await expect(tabs.first()).toBeVisible();
  });

  // ── Add material ──────────────────────────────────────────────────────────
  test('opens Add Material modal', async ({ page }) => {
    const addBtn = page
      .locator('button')
      .filter({ hasText: /tambah material|add material/i });
    await expect(addBtn).toBeVisible({ timeout: 6_000 });
    await addBtn.click();

    await expect(page.locator('h3').filter({ hasText: /tambah material|add material/i })).toBeVisible();
  });

  test('validates required name field', async ({ page }) => {
    await page.locator('button').filter({ hasText: /tambah material|add material/i }).click();
    await expect(page.locator('h3').filter({ hasText: /material/i })).toBeVisible();

    // Click save without filling name
    const saveBtn = page.locator('button').filter({ hasText: /catalog|simpan|save/i }).first();
    await saveBtn.click();

    // Toast error should appear
    await expect(
      page.locator('[role="alert"], [class*="toast"]').filter({ hasText: /wajib|required/i }),
    ).toBeVisible({ timeout: 6_000 });
  });

  test('fills and saves new material', async ({ page }) => {
    await page.locator('button').filter({ hasText: /tambah material|add material/i }).click();
    await expect(page.locator('h3').filter({ hasText: /material/i })).toBeVisible();

    await page.locator('input[placeholder*="Cobalt"]').fill(UNIQUE);
    await page.locator('input[placeholder*="meters"]').fill('yard');

    const saveBtn = page.locator('button').filter({ hasText: /catalog|simpan|save/i }).first();
    await saveBtn.click();

    // Modal should close
    await expect(page.locator('h3').filter({ hasText: /tambah material/i })).toHaveCount(0, { timeout: 5_000 });
  });

  // ── Supplier tab ──────────────────────────────────────────────────────────
  test('switches to Suppliers tab', async ({ page }) => {
    await page.locator('button').filter({ hasText: /supplier/i }).first().click();
    await expect(page.locator('text=/Tambah Supplier|Add Supplier/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add Supplier modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /supplier/i }).first().click();
    await page.locator('button').filter({ hasText: /tambah supplier|add supplier/i }).first().click();

    await expect(page.locator('h3').filter({ hasText: /supplier/i })).toBeVisible({ timeout: 6_000 });
  });

  test('fills and saves new supplier', async ({ page }) => {
    await page.locator('button').filter({ hasText: /supplier/i }).first().click();
    await page.locator('button').filter({ hasText: /tambah supplier|add supplier/i }).first().click();

    await page.locator('input').first().fill(`PW Supplier ${Date.now()}`);

    const saveBtn = page.locator('button').filter({ hasText: /simpan|save|catalog/i }).first();
    await saveBtn.click();
  });

  // ── Purchase Orders tab ───────────────────────────────────────────────────
  test('switches to Purchase Orders tab', async ({ page }) => {
    await page.locator('button').filter({ hasText: /purchase/i }).first().click();
    await expect(page.locator('text=/Purchase Order|PO/i').first()).toBeVisible({ timeout: 6_000 });
  });

  test('opens Add PO modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /purchase/i }).first().click();
    const addPOBtn = page.locator('button').filter({ hasText: /tambah po|add po|purchase order/i });
    if (await addPOBtn.isVisible()) {
      await addPOBtn.click();
      await expect(page.locator('h3').filter({ hasText: /purchase|PO/i })).toBeVisible({ timeout: 6_000 });
    }
  });

  // ── Edit supplier ─────────────────────────────────────────────────────────
  test('can edit a supplier via row action', async ({ page }) => {
    await page.locator('button').filter({ hasText: /supplier/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Click edit icon on first supplier row (pencil icon button)
    const editButtons = page.locator('button[title*="edit"], button[aria-label*="edit"], svg[class*="Pencil"]');
    const count = await editButtons.count();
    if (count > 0) {
      await editButtons.first().click();
      await expect(page.locator('h3').filter({ hasText: /edit supplier/i })).toBeVisible({ timeout: 6_000 });

      // Change name
      const nameInput = page.locator('input').first();
      await nameInput.fill(`Updated Supplier ${Date.now()}`);

      const saveBtn = page.locator('button').filter({ hasText: /simpan|save/i }).first();
      await saveBtn.click();
    }
  });

  // ── SmartTable interaction ────────────────────────────────────────────────
  test('SmartTable search filters rows', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyz_nonexistent_999');
      // Row count should reduce (or empty state visible)
      await page.waitForTimeout(400);
      const emptyMsg = page.locator('text=/no result|kosong|tidak ada|empty/i');
      const rows = page.locator('table tbody tr, [role="row"]');
      const rowCount = await rows.count();
      const hasEmpty = await emptyMsg.isVisible().catch(() => false);
      expect(rowCount === 0 || hasEmpty).toBeTruthy();
    }
  });
});
