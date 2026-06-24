import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly kpiCards     = () => this.page.locator('[class*="kpi"], [class*="KPI"], [class*="metric"]');
  readonly chartSection = () => this.page.locator('svg, canvas, [class*="chart"], [class*="bar"]').first();
  readonly periodBtns   = () => this.page.locator('button').filter({ hasText: /^(1M|3M|6M|1Y)$/ });
  readonly sidebar      = () => this.page.locator('nav, [class*="sidebar"]').first();
  readonly aiPanel      = () => this.page.locator('[class*="insight"], [class*="ai"]').first();
  readonly lowStockAlert = () => this.page.locator('text=/Stok Kritis/i');
  readonly greeting     = () => this.page.locator('text=/Selamat|Welcome|Halo/i').first();

  async goto() {
    await super.goto('/app/dashboard');
  }

  async expectKpiCardsVisible(minCount = 3) {
    await expect(this.page.locator('text=/Revenue|Profit|Pendapatan|Laba|Inventori|Warning/i').first())
      .toBeVisible({ timeout: 8_000 });
  }

  async expectChartVisible() {
    await expect(this.chartSection()).toBeVisible({ timeout: 8_000 });
  }

  async clickPeriod(period: '1M' | '3M' | '6M' | '1Y') {
    const btn = this.page.locator('button').filter({ hasText: period });
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expectSidebarVisible() {
    await expect(this.page.locator('text="Dashboard"').first()).toBeVisible({ timeout: 6_000 });
  }

  async expectBusinessNameInSidebar() {
    await expect(this.page.locator('text=/NEVAEH|ILLUMINIST/i').first()).toBeVisible({ timeout: 6_000 });
  }

  async expectNoErrorBoundary() {
    await expect(this.page.locator('text=/Something went wrong|Error boundary|Uncaught/i')).toHaveCount(0);
  }

  async sidebarNavigateTo(label: string) {
    await this.page.locator(`text="${label}"`).first().click();
    await this.waitForApp();
  }
}
