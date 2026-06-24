import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  // Tab icons / buttons
  readonly tabWorkspace    = () => this.page.locator('button[title*="workspace"], button').filter({ hasText: /workspace/i }).first();
  readonly tabTheme        = () => this.page.locator('button[title*="theme"], button').filter({ hasText: /theme|tema/i }).first();
  readonly tabLocalization = () => this.page.locator('button[title*="local"], button').filter({ hasText: /local/i }).first();
  readonly tabRules        = () => this.page.locator('button[title*="rules"], button').filter({ hasText: /rules/i }).first();
  readonly tabAI           = () => this.page.locator('button[title*="ai"], button').filter({ hasText: /^ai$/i }).first();
  readonly tabMaintenance  = () => this.page.locator('button[title*="maint"], button').filter({ hasText: /maintenance/i }).first();

  // Workspace fields
  readonly brandNameInput  = () => this.page.locator('input[placeholder*="ILLUMINIST"]');
  readonly brandSlogan     = () => this.page.locator('input').nth(1);
  readonly monogramInput   = () => this.page.locator('input[maxlength="3"]').first();
  readonly accentColor     = () => this.page.locator('input[type="color"]').first();
  readonly themeSelect     = () => this.page.locator('select').filter({ hasText: /dark|light/i }).first();

  // Language buttons
  readonly btnEnglish      = () => this.page.locator('button').filter({ hasText: /english|EN/i }).first();
  readonly btnIndonesia    = () => this.page.locator('button').filter({ hasText: /indonesia|ID/i }).first();

  // Currency buttons
  readonly btnIDR          = () => this.page.locator('button').filter({ hasText: /IDR|Rp/i }).first();
  readonly btnUSD          = () => this.page.locator('button').filter({ hasText: /USD|\$ USD/i }).first();

  // Purge
  readonly purgeBtn        = () => this.page.locator('button').filter({ hasText: /purge/i }).first();

  // JSON export
  readonly jsonExport      = () => this.page.locator('pre').first();

  async goto() {
    await super.goto('/app/settings');
  }

  async expectModalOpen(text: string | RegExp) {
    await expect(
      this.page.locator('h3, [class*="modal"]').filter({ hasText: text }),
    ).toBeVisible({ timeout: 6_000 });
  }

  async clickTabByIndex(index: number) {
    const tabs = this.page.locator('[class*="tab"] button, [role="tablist"] button, [class*="settings"] button');
    const count = await tabs.count();
    if (index < count) await tabs.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  async expectSettingsLoaded() {
    await expect(this.page.locator('text=/Settings|Pengaturan/i').first()).toBeVisible({ timeout: 8_000 });
  }

  async switchLanguage(lang: 'en' | 'id') {
    const btn = lang === 'en' ? this.btnEnglish() : this.btnIndonesia();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
    await this.page.waitForTimeout(300);
  }

  async switchCurrency(currency: 'IDR' | 'USD') {
    const btn = currency === 'IDR' ? this.btnIDR() : this.btnUSD();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
    await this.page.waitForTimeout(300);
  }
}

// ── Team Page ─────────────────────────────────────────────────────────────────

export class TeamPage extends BasePage {
  readonly emailInput    = () => this.page.locator('input[type="email"]');
  readonly roleSelect    = () => this.page.locator('select').first();
  readonly inviteBtn     = () => this.page.locator('button').filter({ hasText: /undang|invite/i }).first();
  readonly refreshBtn    = () => this.page.locator('button').filter({ has: this.page.locator('svg') }).nth(1);
  readonly memberRows    = () => this.page.locator('[class*="member"], tr').filter({ hasText: /@|\.com/i });

  async goto() {
    await super.goto('/app/team');
  }

  async fillInviteEmail(email: string) {
    await this.emailInput().fill(email);
  }

  async selectRole(role: string) {
    await this.roleSelect().selectOption(role);
  }

  async sendInvite() {
    await this.inviteBtn().click();
  }

  async expectMemberCount(min: number) {
    const count = await this.memberRows().count();
    expect(count).toBeGreaterThanOrEqual(min);
  }

  async refresh() {
    if (await this.refreshBtn().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.refreshBtn().click();
      await this.page.waitForTimeout(1_000);
    }
  }
}
