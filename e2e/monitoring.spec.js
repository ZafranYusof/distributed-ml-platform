const { test, expect } = require('@playwright/test');

test.describe('Monitoring', () => {
  test('Monitoring page loads', async ({ page }) => {
    await page.goto('/monitoring');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/monitor/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Shows monitoring UI or sign-in message', async ({ page }) => {
    await page.goto('/monitoring');
    // Either shows drift/alerts UI or "Sign in to access monitoring"
    const content = page.locator('text=/drift|alert|sign in|overview/i').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
