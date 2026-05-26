const { test, expect } = require('@playwright/test');

test.describe('Pipeline Builder', () => {
  test('Pipeline Builder page loads', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/pipeline/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Canvas area renders (React Flow)', async ({ page }) => {
    await page.goto('/pipeline');
    const canvas = page.locator('[class*="react-flow"], [class*="reactflow"], [class*="canvas"], [class*="flow"]').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('Node palette visible', async ({ page }) => {
    await page.goto('/pipeline');
    const palette = page.locator('[class*="palette"], [class*="node-list"], [class*="sidebar"], [class*="panel"]').first();
    await expect(palette).toBeVisible({ timeout: 10000 });
  });
});
