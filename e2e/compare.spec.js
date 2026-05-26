const { test, expect } = require('@playwright/test');

test.describe('Compare', () => {
  test('Compare page loads', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/compare/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Page has interactive elements for adding configurations', async ({ page }) => {
    await page.goto('/compare');
    // Look for buttons or selects to add/configure comparisons
    const interactive = page.locator('button, select, input').first();
    await expect(interactive).toBeVisible({ timeout: 10000 });
  });

  test('Start comparison button present', async ({ page }) => {
    await page.goto('/compare');
    const compareBtn = page.locator('button:has-text("Compare"), button:has-text("Start"), button:has-text("Run"), button:has-text("Add")').first();
    await expect(compareBtn).toBeVisible({ timeout: 10000 });
  });
});
