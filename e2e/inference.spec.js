const { test, expect } = require('@playwright/test');

test.describe('Inference', () => {
  test('Inference page loads', async ({ page }) => {
    await page.goto('/inference');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toMatch(/inference|predict/);
  });

  test('Page renders without crash', async ({ page }) => {
    await page.goto('/inference');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('Page has heading and structure', async ({ page }) => {
    await page.goto('/inference');
    const heading = page.locator('h1').or(page.locator('h2')).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
