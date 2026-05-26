const { test, expect } = require('@playwright/test');

test.describe('Data Explorer', () => {
  test('Data Explorer page loads', async ({ page }) => {
    await page.goto('/data-explorer');
    await expect(page.locator('body')).toBeVisible();
    // Page has a heading
    const heading = page.locator('h1').or(page.locator('h2')).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('File upload area visible', async ({ page }) => {
    await page.goto('/data-explorer');
    // Data Explorer has a drag-and-drop upload area
    const uploadArea = page.locator('[class*="drop"]').or(page.locator('[class*="upload"]')).or(page.locator('input[type="file"]')).or(page.locator('[class*="border-dashed"]')).first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
  });
});
