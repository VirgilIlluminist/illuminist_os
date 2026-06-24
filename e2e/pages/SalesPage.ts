import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface NewSale {
  customerName: string;
  channel?: string;
  status?: string;
}

export interface NewOpsCost {
  category?: string;
  platform?: string;
  notes?: string;
}

export interface NewAdsCampaign {
  name: string;
  platform?: string;
}

export interface NewKOL {
  name: string;
  platform?: string;
}

export class SalesPage extends BasePage {
  // Tabs
  readonly tabSales   = () => this.page.locator('button').filter({ hasText: /^sales\s*\[|^penjualan/i }).first();
  readonly tabOps     = () => this.page.locator('button').filter({ hasText: /^ops\s*\[/i }).first();
  readonly tabAds     = () => this.page.locator('button').filter({ hasText: /^ads\s*\[/i }).first();
  readonly tabKOL     = () => this.page.locator('button').filter({ hasText: /^kol\s*\[/i }).first();

  // Header buttons
  readonly btnAddSale = () => this.page.locator('button').filter({ hasText: /tambah penjualan/i }).first();
  readonly btnAddOps  = () => this.page.locator('button').filter({ hasText: /tambah biaya|biaya operasional/i }).first();
  readonly btnAddAds  = () => this.page.locator('button').filter({ hasText: /tambah campaign/i }).first();
  readonly btnAddKOL  = () => this.page.locator('button').filter({ hasText: /tambah kol/i }).first();

  // Sale modal fields
  readonly buyerInput       = () => this.page.locator('input[placeholder*="Rina"]');
  readonly channelSelect    = () => this.page.locator('select').nth(1);
  readonly saleStatusSelect = () => this.page.locator('select').last();
  readonly saleSaveBtn      = () => this.page.locator('button').filter({ hasText: /log order|simpan/i }).last();
  readonly saleDeleteBtn    = () => this.page.locator('button').filter({ hasText: /hapus/i }).first();

  // Ops modal
  readonly platformInput    = () => this.page.locator('input[placeholder*="Meta Ads"]');
  readonly opsNotesInput    = () => this.page.locator('textarea').first();
  readonly opsSaveBtn       = () => this.page.locator('button').filter({ hasText: /catat biaya/i }).last();

  // Ads modal
  readonly campaignNameInput = () => this.page.locator('input[placeholder*="Summer Drop"]');
  readonly adsSaveBtn        = () => this.page.locator('button').filter({ hasText: /simpan campaign/i }).last();

  // KOL modal
  readonly kolNameInput  = () => this.page.locator('input[placeholder*="@influencer"]');
  readonly kolSaveBtn    = () => this.page.locator('button').filter({ hasText: /tambah kol/i }).last();

  // Search
  readonly searchInput   = () => this.page.locator('input[placeholder*="Cari order"]').first();

  async goto() {
    await super.goto('/app/sales');
  }

  async goToOps() {
    await super.goto('/app/costs');
  }

  async goToAds() {
    await super.goto('/app/ads');
  }

  async goToKOL() {
    await super.goto('/app/kol');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  async clickTabSales() {
    await this.page.locator('button').filter({ hasText: /sales|penjualan/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabOps() {
    await this.page.locator('button').filter({ hasText: /ops/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabAds() {
    await this.page.locator('button').filter({ hasText: /ads/i }).first().click();
    await this.page.waitForTimeout(200);
  }

  async clickTabKOL() {
    await this.page.locator('button').filter({ hasText: /kol/i }).first().click();
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

  // ── Add Sale ──────────────────────────────────────────────────────────────

  async openAddSaleModal() {
    const btn = this.btnAddSale();
    if (!await btn.isVisible({ timeout: 4_000 }).catch(() => false)) return;
    await btn.click();
    await this.expectModalOpen(/tambah penjualan|log order/i);
  }

  async fillSaleForm(data: NewSale) {
    const buyerInput = this.buyerInput();
    if (await buyerInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await buyerInput.fill(data.customerName);
    }
  }

  async saveSale() {
    await this.saleSaveBtn().click();
  }

  async addSale(data: NewSale): Promise<void> {
    await this.openAddSaleModal();
    await this.fillSaleForm(data);
    await this.saveSale();
    await this.page.waitForTimeout(600);
  }

  async openEditSaleForRow(customerName: string) {
    const row = this.page.locator('[class*="row"], tr').filter({ hasText: customerName }).first();
    const editBtn = row.locator('button').filter({ hasText: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await this.expectModalOpen(/edit order/i);
    }
  }

  async deleteSale() {
    await this.saleDeleteBtn().click();
    await this.page.waitForTimeout(400);
  }

  // ── Add Ops Cost ──────────────────────────────────────────────────────────

  async openAddOpsModal() {
    const btn = this.btnAddOps();
    if (!await btn.isVisible({ timeout: 4_000 }).catch(() => false)) return;
    await btn.click();
    await this.expectModalOpen(/biaya operasional/i);
  }

  async fillOpsForm(data: NewOpsCost) {
    if (data.platform) {
      const input = this.platformInput();
      if (await input.isVisible().catch(() => false)) await input.fill(data.platform);
    }
    if (data.notes) {
      const notes = this.opsNotesInput();
      if (await notes.isVisible().catch(() => false)) await notes.fill(data.notes);
    }
  }

  async saveOps() {
    await this.opsSaveBtn().click();
  }

  // ── Add Ads Campaign ──────────────────────────────────────────────────────

  async openAddAdsModal() {
    const btn = this.btnAddAds();
    if (!await btn.isVisible({ timeout: 4_000 }).catch(() => false)) return;
    await btn.click();
    await this.expectModalOpen(/campaign iklan/i);
  }

  async fillAdsForm(data: NewAdsCampaign) {
    const input = this.campaignNameInput();
    if (await input.isVisible().catch(() => false)) await input.fill(data.name);
  }

  async saveAds() {
    await this.adsSaveBtn().click();
  }

  // ── Add KOL ───────────────────────────────────────────────────────────────

  async openAddKOLModal() {
    const btn = this.btnAddKOL();
    if (!await btn.isVisible({ timeout: 4_000 }).catch(() => false)) return;
    await btn.click();
    await this.expectModalOpen(/tambah kol/i);
  }

  async fillKOLForm(data: NewKOL) {
    const input = this.kolNameInput();
    if (await input.isVisible().catch(() => false)) await input.fill(data.name);
  }

  async saveKOL() {
    await this.kolSaveBtn().click();
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async search(term: string) {
    const input = this.searchInput();
    if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await input.fill(term);
      await this.page.waitForTimeout(400);
    }
  }

  async expectSaleInTable(customerName: string) {
    await expect(this.page.locator(`text="${customerName}"`).first()).toBeVisible({ timeout: 6_000 });
  }

  async expectSaleNotInTable(customerName: string) {
    await expect(this.page.locator(`text="${customerName}"`)).toHaveCount(0, { timeout: 5_000 });
  }
}
