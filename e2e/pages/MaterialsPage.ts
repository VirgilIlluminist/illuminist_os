import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface NewMaterial {
  name: string;
  category?: string;
  unit?: string;
  stock?: string;
  costPerUnit?: string;
  minStock?: string;
  notes?: string;
}

export interface NewSupplier {
  name: string;
  contact?: string;
  score?: string;
  tier?: string;
}

export interface NewPO {
  qty?: string;
  status?: string;
}

export class MaterialsPage extends BasePage {
  // Tabs
  readonly tabLibrary       = () => this.page.locator('button').filter({ hasText: /library|material library/i }).first();
  readonly tabPurchaseOrders = () => this.page.locator('button').filter({ hasText: /purchase/i }).first();
  readonly tabSuppliers     = () => this.page.locator('button').filter({ hasText: /^suppliers?\s*\[/i }).first()
                                  ?? this.page.locator('button').filter({ hasText: /supplier/i }).first();

  // Header buttons
  readonly btnAddMaterial   = () => this.page.locator('button').filter({ hasText: /tambah material|add material/i }).first();
  readonly btnAddPO         = () => this.page.locator('button').filter({ hasText: /tambah po|add po/i }).first();
  readonly btnAddSupplier   = () => this.page.locator('button').filter({ hasText: /tambah supplier|add supplier/i }).first();

  // Search & filters
  readonly searchInput      = () => this.page.locator('input[placeholder*="Cari"]').first();
  readonly categoryFilter   = () => this.page.locator('select').filter({ hasText: /semua kategori|kategori/i }).first();
  readonly stockFilter      = () => this.page.locator('select').filter({ hasText: /semua status/i }).first();

  // Add Material modal fields
  readonly matNameInput     = () => this.page.locator('input[placeholder*="Cobalt"]');
  readonly matCategorySelect = () => this.page.locator('select').first();
  readonly matUnitInput     = () => this.page.locator('input[placeholder*="meters"]');
  readonly matNotesInput    = () => this.page.locator('textarea[placeholder*="Catatan"]');
  readonly matSaveBtn       = () => this.page.locator('button').filter({ hasText: /catalog|tambah material/i }).last();
  readonly matSimpanBtn     = () => this.page.locator('button').filter({ hasText: /simpan/i }).last();

  // Supplier modal
  readonly supNameInput     = () => this.page.locator('input[placeholder*="Tekstil"]');
  readonly supContactInput  = () => this.page.locator('input[placeholder*="Nama —"]');
  readonly supAffiliateBtn  = () => this.page.locator('button').filter({ hasText: /affiliate/i }).last();

  async goto() {
    await super.goto('/app/materials');
  }

  async goToPurchaseOrders() {
    await super.goto('/app/purchase-orders');
  }

  async goToSuppliers() {
    await super.goto('/app/suppliers');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  async clickTabLibrary() {
    await this.page.locator('button').filter({ hasText: /material library|library/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabPurchaseOrders() {
    await this.page.locator('button').filter({ hasText: /purchase/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabSuppliers() {
    await this.page.locator('button').filter({ hasText: /supplier/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  // ── Add Material ──────────────────────────────────────────────────────────

  async openAddMaterialModal() {
    await this.btnAddMaterial().click();
    await this.expectModalOpen(/tambah material|add material/i);
  }

  async expectModalOpen(text: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: text }),
    ).toBeVisible({ timeout: 6_000 });
  }

  async fillMaterialForm(data: NewMaterial) {
    await this.matNameInput().fill(data.name);
    if (data.unit) await this.matUnitInput().fill(data.unit);
    if (data.notes) await this.matNotesInput().fill(data.notes);
  }

  async saveMaterial() {
    await this.matSaveBtn().click();
  }

  async addMaterial(data: NewMaterial) {
    await this.openAddMaterialModal();
    await this.fillMaterialForm(data);
    await this.saveMaterial();
    await this.expectModalOpen(/tambah material/i).catch(() => {}); // wait for close
    await this.page.waitForTimeout(500);
  }

  // ── Edit / Delete Material ────────────────────────────────────────────────

  async openEditMaterialForRow(nameText: string) {
    const row = this.page.locator('[class*="row"], tr').filter({ hasText: nameText }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await this.expectModalOpen(/edit material/i);
    }
  }

  async deleteMaterial() {
    await this.page.locator('button').filter({ hasText: /hapus/i }).first().click();
  }

  // ── Add Supplier ──────────────────────────────────────────────────────────

  async openAddSupplierModal() {
    await this.btnAddSupplier().click();
    await this.expectModalOpen(/tambah supplier/i);
  }

  async fillSupplierForm(data: NewSupplier) {
    await this.supNameInput().fill(data.name);
    if (data.contact) await this.supContactInput().fill(data.contact);
    if (data.tier) {
      const tierSelect = this.page.locator('select').last();
      await tierSelect.selectOption(data.tier);
    }
  }

  async saveSupplier() {
    await this.supAffiliateBtn().click();
  }

  async addSupplier(data: NewSupplier) {
    await this.openAddSupplierModal();
    await this.fillSupplierForm(data);
    await this.saveSupplier();
    await this.page.waitForTimeout(500);
  }

  // ── Edit Supplier ─────────────────────────────────────────────────────────

  async openEditSupplierForRow(nameText: string) {
    const row = this.page.locator('[class*="row"], tr').filter({ hasText: nameText }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await this.expectModalOpen(/edit supplier/i);
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
    const input = this.searchInput();
    if (await input.isVisible().catch(() => false)) {
      await input.fill('');
      await this.page.waitForTimeout(300);
    }
  }

  async expectMaterialInTable(name: string) {
    await expect(this.page.locator(`text="${name}"`).first()).toBeVisible({ timeout: 6_000 });
  }

  async expectMaterialNotInTable(name: string) {
    await expect(this.page.locator(`text="${name}"`)).toHaveCount(0, { timeout: 5_000 });
  }
}
