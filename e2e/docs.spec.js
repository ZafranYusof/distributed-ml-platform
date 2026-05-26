const { test, expect } = require('@playwright/test');

test.describe('Documentation', () => {
  test('Documentation page loads', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/documentation|docs|guide/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Sidebar navigation visible', async ({ page }) => {
    await page.goto('/docs');
    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="toc"], [class*="nav"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('Search input works', async ({ page }) => {
    await page.goto('/docs');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('Sections render', async ({ page }) => {
    await page.goto('/docs');
    // Check for key documentation sections
    const sections = page.locator('text=/getting started|features|api|glossary|faq|changelog/i');
    await expect(sections.first()).toBeVisible({ timeout: 10000 });
  });
});
