const { test, expect } = require('@playwright/test');

test.describe('Notebook', () => {
  test('Notebook page loads', async ({ page }) => {
    await page.goto('/notebook');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('notebook');
  });

  test('New Notebook button present', async ({ page }) => {
    await page.goto('/notebook');
    const newBtn = page.locator('button:has-text("New Notebook")').or(page.locator('button:has-text("New")')).or(page.locator('button[aria-label*="Create"]')).first();
    await expect(newBtn).toBeVisible({ timeout: 10000 });
  });

  test('Shows notebooks list or empty state', async ({ page }) => {
    await page.goto('/notebook');
    // Either shows notebook cards, empty state, or "New Notebook" button
    const content = page.locator('button:has-text("New Notebook")').or(page.locator('[class*="empty"]')).or(page.locator('[class*="card"]')).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
