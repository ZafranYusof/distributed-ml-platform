const { test, expect } = require('@playwright/test');

test.describe('Marketplace', () => {
  test('Marketplace page loads', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/marketplace|model/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Search functionality present', async ({ page }) => {
    await page.goto('/marketplace');
    // SearchFilterBar renders a search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"], input[placeholder*="model" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('Page has action buttons', async ({ page }) => {
    await page.goto('/marketplace');
    // Should have publish button or sort options
    const actions = page.locator('button, select').first();
    await expect(actions).toBeVisible({ timeout: 10000 });
  });
});
