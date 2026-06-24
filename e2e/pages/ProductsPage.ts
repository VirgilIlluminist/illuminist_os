import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface NewProduct {
  name: string;
  collection?: string;
  category?: string;
  status?: 'Active' | 'Draft' | 'Archived';
}

export interface NewSample {
  version?: string;
  notes?: string;
}

export interface NewBatch {
  factory?: string;
  status?: string;
}

export interface NewVariant {
  sku: string;
  size?: string;
}

export class ProductsPage extends BasePage {
  // Tabs
  readonly tabMaster      = () => this.page.locator('button').filter({ hasText: /^products?\s*\[|^master/i }).first();
  readonly tabSamples     = () => this.page.locator('button').filter({ hasText: /sample/i }).first();
  readonly tabProduction  = () => this.page.locator('button').filter({ hasText: /produksi|production/i }).first();
  readonly tabVariants    = () => this.page.locator('button').filter({ hasText: /variant/i }).first();

  // Header buttons
  readonly btnAddProduct  = () => this.page.locator('button').filter({ hasText: /tambah produk|add product/i }).first();
  readonly btnAddSample   = () => this.page.locator('button').filter({ hasText: /tambah sample/i }).first();
  readonly btnAddBatch    = () => this.page.locator('button').filter({ hasText: /tambah batch/i }).first();
  readonly btnAddVariant  = () => this.page.locator('button').filter({ hasText: /tambah variant/i }).first();

  // Add Product modal
  readonly prodNameInput   = () => this.page.locator('input[placeholder*="Oversize Tee"]');
  readonly prodCollInput   = () => this.page.locator('input[placeholder*="Essential Series"]');
  readonly prodCatInput    = () => this.page.locator('input').nth(2);
  readonly prodStatusSelect = () => this.page.locator('select').first();
  readonly prodSaveBtn     = () => this.page.locator('button').filter({ hasText: /tambah produk|simpan/i }).last();
  readonly prodDeleteBtn   = () => this.page.locator('button').filter({ hasText: /hapus/i }).first();

  // Search
  readonly searchInput    = () => this.page.locator('input[placeholder*="Cari produk"]').first();
  readonly collectionFilter = () => this.page.locator('select[aria-label], select').first();

  async goto() {
    await super.goto('/app/products');
  }

  async goToSampleDev() {
    await super.goto('/app/sample-dev');
  }

  async goToProduction() {
    await super.goto('/app/production');
  }

  async goToInventory() {
    await super.goto('/app/inventory');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  async clickTabMaster() {
    await this.page.locator('button').filter({ hasText: /produk|product|master/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabSamples() {
    await this.page.locator('button').filter({ hasText: /sample/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabProduction() {
    await this.page.locator('button').filter({ hasText: /produksi|production/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabVariants() {
    await this.page.locator('button').filter({ hasText: /variant/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  async expectModalOpen(text: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: text }),
    ).toBeVisible({ timeout: 6_000 });
  }

  async expectModalClosed(text: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: text }),
    ).toHaveCount(0, { timeout: 5_000 });
  }

  // ── Add / Edit / Delete Product ───────────────────────────────────────────

  async openAddProductModal() {
    await this.btnAddProduct().click();
    await this.expectModalOpen(/tambah produk/i);
  }

  async fillProductForm(data: NewProduct) {
    await this.prodNameInput().fill(data.name);
    if (data.collection) {
      const coll = this.page.locator('input[placeholder*="Essential"]');
      await coll.fill(data.collection);
    }
    if (data.status) await this.prodStatusSelect().selectOption(data.status);
  }

  async saveProduct() {
    await this.prodSaveBtn().click();
  }

  async addProduct(data: NewProduct): Promise<void> {
    await this.openAddProductModal();
    await this.fillProductForm(data);
    await this.saveProduct();
    await this.page.waitForTimeout(600);
  }

  async openEditProductForRow(nameText: string) {
    const row = this.page.locator('[class*="row"], tr').filter({ hasText: nameText }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
    }
  }

  async deleteProduct() {
    await this.prodDeleteBtn().click();
    await this.page.waitForTimeout(400);
  }

  async editProductField(field: 'name', value: string) {
    await this.prodNameInput().fill(value);
  }

  // ── Add Sample ────────────────────────────────────────────────────────────

  async openAddSampleModal() {
    const btn = this.btnAddSample();
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      await this.expectModalOpen(/tambah sample/i);
    }
  }

  // ── Add Batch ─────────────────────────────────────────────────────────────

  async openAddBatchModal() {
    const btn = this.btnAddBatch();
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      await this.expectModalOpen(/tambah batch/i);
    }
  }

  // ── Add Variant ───────────────────────────────────────────────────────────

  async openAddVariantModal() {
    const btn = this.btnAddVariant();
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.click();
      await this.expectModalOpen(/tambah variant/i);
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async search(term: string) {
    const input = this.searchInput();
    if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await input.fill(term);
      await this.page.waitForTimeout(400);
    }
  }

  async clearSearch() {
    await this.search('');
  }

  async expectProductInTable(name: string) {
    await expect(this.page.locator(`text="${name}"`).first()).toBeVisible({ timeout: 6_000 });
  }

  async expectProductNotInTable(name: string) {
    await expect(this.page.locator(`text="${name}"`)).toHaveCount(0, { timeout: 5_000 });
  }
}
