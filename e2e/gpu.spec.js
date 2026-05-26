const { test, expect } = require('@playwright/test');

test.describe('GPU Acceleration', () => {
  test('GPU Acceleration page loads', async ({ page }) => {
    await page.goto('/gpu');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/gpu|acceleration/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('GPU page has interactive controls', async ({ page }) => {
    await page.goto('/gpu');
    // Page has buttons for checking WebGPU or running benchmarks
    const controls = page.locator('button').first();
    await expect(controls).toBeVisible({ timeout: 10000 });
  });
});
