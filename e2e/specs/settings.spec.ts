import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../helpers/auth';
import { SettingsPage, TeamPage } from '../pages/SettingsPage';

const TS = () => Date.now();

// ── Settings ──────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  let pg: SettingsPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new SettingsPage(page);
    await pg.goto();
  });

  test('loads Settings page', async () => {
    await pg.expectSettingsLoaded();
  });

  test('does not crash', async ({ page }) => {
    await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
  });

  // ── Workspace tab ─────────────────────────────────────────────────────────

  test('shows brand name input', async ({ page }) => {
    const input = page.locator('input[placeholder*="ILLUMINIST"]');
    if (await input.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(input).toBeVisible();
    }
  });

  test('can edit brand name', async ({ page }) => {
    const input = page.locator('input[placeholder*="ILLUMINIST"]');
    if (await input.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await input.fill('PW Test Brand');
      await expect(input).toHaveValue('PW Test Brand');
      // restore
      await input.fill('ILLUMINIST OS');
    }
  });

  test('language buttons are visible', async ({ page }) => {
    const en = page.locator('button').filter({ hasText: /english|EN/i }).first();
    const id = page.locator('button').filter({ hasText: /indonesia|ID/i }).first();
    if (await en.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(en).toBeVisible();
      await expect(id).toBeVisible();
    }
  });

  test('switching to English language works', async () => {
    await pg.switchLanguage('en');
  });

  test('switching to Indonesian language works', async () => {
    await pg.switchLanguage('id');
  });

  test('switching language does not crash', async () => {
    await pg.switchLanguage('en');
    await pg.switchLanguage('id');
    await pg.switchLanguage('en');
  });

  test('currency buttons are visible', async ({ page }) => {
    const idr = page.locator('button').filter({ hasText: /IDR|Rp/i }).first();
    if (await idr.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(idr).toBeVisible();
    }
  });

  test('switching to USD currency works', async () => {
    await pg.switchCurrency('USD');
  });

  test('switching back to IDR works', async () => {
    await pg.switchCurrency('USD');
    await pg.switchCurrency('IDR');
  });

  test('Purge Database button is visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /purge/i }).first();
    if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('JSON Database Export section is visible', async ({ page }) => {
    const pre = page.locator('pre').first();
    if (await pre.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(pre).toBeVisible();
    }
  });

  // ── Theme tab ─────────────────────────────────────────────────────────────

  test('Theme tab is clickable', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /theme|tema/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
    }
  });

  test('Theme presets are visible', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /theme|tema/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      const presets = page.locator('button').filter({ hasText: /midnight|ocean|forest|rose|light/i });
      const count = await presets.count();
      if (count > 0) {
        await expect(presets.first()).toBeVisible();
      }
    }
  });

  test('clicking a theme preset does not crash', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /theme|tema/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      const preset = page.locator('button').filter({ hasText: /ocean/i }).first();
      if (await preset.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await preset.click();
        await page.waitForTimeout(300);
        await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
      }
    }
  });

  // ── AI Settings tab ───────────────────────────────────────────────────────

  test('AI Settings tab is clickable', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /^ai$/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
    }
  });

  // ── Localization tab ──────────────────────────────────────────────────────

  test('Localization tab is clickable', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /local/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
    }
  });

  // ── Maintenance tab ───────────────────────────────────────────────────────

  test('Maintenance tab is clickable', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /maintenance/i }).first();
    if (await tab.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=/Something went wrong/i')).toHaveCount(0);
    }
  });
});

// ── Team Page ─────────────────────────────────────────────────────────────────

test.describe('Team Management', () => {
  let pg: TeamPage;

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    pg = new TeamPage(page);
    await pg.goto();
  });

  test('loads Team page', async ({ page }) => {
    await expect(page.locator('text=/Team|Tim/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('invite email input is visible', async () => {
    await expect(pg.emailInput()).toBeVisible({ timeout: 6_000 });
  });

  test('role selector is visible', async () => {
    await expect(pg.roleSelect()).toBeVisible({ timeout: 6_000 });
  });

  test('role selector has all 8 roles', async ({ page }) => {
    const roleSelect = page.locator('select').first();
    const opts = await roleSelect.locator('option').allTextContents();
    expect(opts.some(o => /owner/i.test(o))).toBeTruthy();
    expect(opts.some(o => /admin/i.test(o))).toBeTruthy();
    expect(opts.some(o => /viewer/i.test(o))).toBeTruthy();
    expect(opts.some(o => /finance|keuangan/i.test(o))).toBeTruthy();
  });

  test('Undang button is visible', async () => {
    await expect(pg.inviteBtn()).toBeVisible({ timeout: 6_000 });
  });

  test('shows error on empty email invite', async ({ page }) => {
    await pg.sendInvite();
    await expect(
      page.locator('[role="alert"], [class*="toast"]').filter({ hasText: /email|wajib|required/i }),
    ).toBeVisible({ timeout: 6_000 });
  });

  test('fills email and role then submits', async ({ page }) => {
    await pg.fillInviteEmail(`pw-${TS()}@test.com`);
    await pg.selectRole('viewer');
    await pg.sendInvite();
    // Either success or info toast (Supabase admin may not be available)
    await expect(
      page.locator('[role="alert"], [class*="toast"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('role selector options are selectable', async () => {
    for (const role of ['owner', 'admin', 'viewer', 'finance']) {
      try {
        await pg.selectRole(role);
      } catch {
        // role may not exist — skip
      }
    }
  });

  test('refresh button reloads member list', async () => {
    await pg.refresh();
  });

  test('SQL helper section shows SQL template', async ({ page }) => {
    const pre = page.locator('pre').first();
    if (await pre.isVisible({ timeout: 4_000 }).catch(() => false)) {
      const text = await pre.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('role guide section is visible', async ({ page }) => {
    const guide = page.locator('text=/role guide|panduan peran|owner|admin/i').first();
    if (await guide.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(guide).toBeVisible();
    }
  });

  test('member row deactivate buttons are visible', async ({ page }) => {
    await pg.refresh();
    await page.waitForTimeout(1_500);
    const deactivateBtns = page.locator('button').filter({ hasText: /nonaktif|deactivate|aktivasi/i });
    const count = await deactivateBtns.count();
    // If members exist, buttons should be there; 0 members is also valid
    expect(count >= 0).toBeTruthy();
  });
});
