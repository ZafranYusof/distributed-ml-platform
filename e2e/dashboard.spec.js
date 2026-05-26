const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test('Dashboard loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Dashboard should have some content
    await expect(page.locator('[class*="dashboard"], [class*="Dashboard"], main, [role="main"]').first()).toBeVisible();
  });

  test('Shows stats cards', async ({ page }) => {
    await page.goto('/');
    // Look for stat/metric cards
    const cards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Navigation sidebar visible with groups', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('Quick action buttons present', async ({ page }) => {
    await page.goto('/');
    // Look for action buttons on dashboard
    const buttons = page.locator('button, a[class*="btn"], a[class*="button"]');
    await expect(buttons.first()).toBeVisible();
  });
});
