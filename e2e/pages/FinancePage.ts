import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FinancePage extends BasePage {
  // KPI cards
  readonly kpiKas       = () => this.page.locator('text=/kas|cash/i').first();
  readonly kpiRevenue   = () => this.page.locator('text=/pendapatan|revenue/i').first();
  readonly kpiBiaya     = () => this.page.locator('text=/biaya|cost/i').first();
  readonly kpiAset      = () => this.page.locator('text=/aset|asset/i').first();

  // Recent transactions table
  readonly txTable      = () => this.page.locator('table, [class*="table"]').first();
  readonly txRows       = () => this.page.locator('table tbody tr, [role="row"]');

  async goto() {
    await super.goto('/app/finance');
  }

  async expectKpiVisible() {
    await expect(this.kpiKas()).toBeVisible({ timeout: 8_000 });
  }

  async expectTableOrEmptyState() {
    const table = this.txTable();
    const empty = this.page.locator('text=/kosong|belum ada|empty|no data/i');
    const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  }

  async expectPageTitle() {
    await expect(this.page.locator('text=/Finance/i').first()).toBeVisible({ timeout: 6_000 });
  }
}

// ── Finances & Assets ─────────────────────────────────────────────────────────

export class FinancesAndAssetsPage extends BasePage {
  // Tabs
  readonly tabReports   = () => this.page.locator('button').filter({ hasText: /reports/i }).first();
  readonly tabCustomers = () => this.page.locator('button').filter({ hasText: /customers/i }).first();
  readonly tabAssets    = () => this.page.locator('button').filter({ hasText: /assets/i }).first();
  readonly tabCashflow  = () => this.page.locator('button').filter({ hasText: /cashflow/i }).first();

  // Layout switchers
  readonly layoutSpreadsheet = () => this.page.locator('button').filter({ hasText: /spreadsheet/i }).first();
  readonly layoutKanban      = () => this.page.locator('button').filter({ hasText: /kanban/i }).first();
  readonly layoutGallery     = () => this.page.locator('button').filter({ hasText: /gallery/i }).first();
  readonly layoutCalendar    = () => this.page.locator('button').filter({ hasText: /calendar/i }).first();
  readonly layoutAnalytics   = () => this.page.locator('button').filter({ hasText: /analytics|chart/i }).first();

  // Controls
  readonly searchInput       = () => this.page.locator('input[placeholder*="Realtime"]').first();
  readonly addColumnBtn      = () => this.page.locator('button').filter({ hasText: /add custom column|\+ add/i }).first();
  readonly addAssetBtn       = () => this.page.locator('button').filter({ hasText: /capitalize|tambah aset/i }).first();
  readonly zebraToggle       = () => this.page.locator('button').filter({ hasText: /zebra/i }).first();
  readonly densityBtns       = () => this.page.locator('button').filter({ hasText: /high|normal|relaxed/i });

  // Add Column modal
  readonly colLabelInput     = () => this.page.locator('input[placeholder*="Audit"]');
  readonly colTypeSelect     = () => this.page.locator('select').first();
  readonly colSaveBtn        = () => this.page.locator('button').filter({ hasText: /assemble column/i }).first();

  // Add Asset modal
  readonly assetNameInput    = () => this.page.locator('input[placeholder*="Masterwork"]');
  readonly assetCatSelect    = () => this.page.locator('select').first();
  readonly assetSaveBtn      = () => this.page.locator('button').filter({ hasText: /capitalize asset/i }).first();

  async gotoAssets() {
    await super.goto('/app/assets');
  }

  async gotoCashflow() {
    await super.goto('/app/cashflow');
  }

  async gotoReports() {
    await super.goto('/app/reports');
  }

  async expectModalOpen(text: string | RegExp) {
    await expect(
      this.page.locator('h3').filter({ hasText: text }),
    ).toBeVisible({ timeout: 6_000 });
  }

  async clickTabAssets() {
    await this.tabAssets().click();
    await this.page.waitForTimeout(300);
  }

  async clickTabCashflow() {
    await this.tabCashflow().click();
    await this.page.waitForTimeout(300);
  }

  async clickTabReports() {
    await this.tabReports().click();
    await this.page.waitForTimeout(300);
  }

  async clickTabCustomers() {
    await this.tabCustomers().click();
    await this.page.waitForTimeout(300);
  }

  async switchLayout(layout: 'spreadsheet' | 'kanban' | 'gallery' | 'calendar' | 'analytics') {
    const btns: Record<string, () => ReturnType<FinancesAndAssetsPage['layoutSpreadsheet']>> = {
      spreadsheet: () => this.layoutSpreadsheet(),
      kanban:      () => this.layoutKanban(),
      gallery:     () => this.layoutGallery(),
      calendar:    () => this.layoutCalendar(),
      analytics:   () => this.layoutAnalytics(),
    };
    const btn = btns[layout]();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openAddColumnModal() {
    const btn = this.addColumnBtn();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await this.expectModalOpen(/initialize custom grid column/i);
    }
  }

  async openAddAssetModal() {
    const btn = this.addAssetBtn();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await this.expectModalOpen(/capitalize equipment/i);
    }
  }

  async fillAddAsset(name: string) {
    const input = this.assetNameInput();
    if (await input.isVisible().catch(() => false)) await input.fill(name);
  }

  async saveAsset() {
    await this.assetSaveBtn().click();
  }

  async toggleZebra() {
    const btn = this.zebraToggle();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
  }

  async setDensity(density: 'high' | 'normal' | 'relaxed') {
    const btn = this.page.locator('button').filter({ hasText: new RegExp(`^${density}$`, 'i') }).first();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
  }
}
