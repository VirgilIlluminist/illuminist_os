import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput    = () => this.page.locator('input[type="email"]');
  readonly passwordInput = () => this.page.locator('input[type="password"]');
  readonly submitButton  = () => this.page.locator('button[type="submit"]');
  readonly toggleButton  = () => this.page.locator('button[type="button"]').filter({ hasText: /daftar|sign up|masuk|login/i }).first();

  async goto() {
    await super.goto('/login');
  }

  async fillEmail(email: string) {
    await this.emailInput().fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput().fill(password);
  }

  async submit() {
    await this.submitButton().click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    await this.page.waitForURL('**/app/dashboard', { timeout: 20_000 });
  }

  async expectOnLoginPage() {
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  async expectRedirectedToDashboard() {
    await expect(this.page).toHaveURL(/\/app\/dashboard/, { timeout: 20_000 });
  }

  async toggleToSignUp() {
    await this.toggleButton().click();
  }

  async expectSubmitButtonText(text: string | RegExp) {
    await expect(this.submitButton()).toContainText(text);
  }
}
