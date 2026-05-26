const { test, expect } = require('@playwright/test');

test.describe('AutoML', () => {
  test('AutoML page loads', async ({ page }) => {
    await page.goto('/automl');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/auto/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Configuration options visible', async ({ page }) => {
    await page.goto('/automl');
    // AutoML page should have some form elements or configuration section
    const configElements = page.locator('select, input[type="number"], input[type="range"], button, [class*="config"]');
    await expect(configElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('Start search button present', async ({ page }) => {
    await page.goto('/automl');
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Search"), button:has-text("Run")').first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
  });
});
