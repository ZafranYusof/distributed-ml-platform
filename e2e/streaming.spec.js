const { test, expect } = require('@playwright/test');

test.describe('Streaming ML', () => {
  test('Streaming ML page loads', async ({ page }) => {
    await page.goto('/streaming');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/stream/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Start stream button present', async ({ page }) => {
    await page.goto('/streaming');
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Stream"), button:has-text("Connect")').first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
  });

  test('Configuration options visible', async ({ page }) => {
    await page.goto('/streaming');
    const configElements = page.locator('input, select, [class*="config"], [class*="setting"]');
    await expect(configElements.first()).toBeVisible({ timeout: 10000 });
  });
});
