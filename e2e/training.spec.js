const { test, expect } = require('@playwright/test');

test.describe('Training', () => {
  test('Training page redirects to dashboard without session data', async ({ page }) => {
    // Training page requires sessionStorage data, redirects to / without it
    await page.goto('/training/new');
    // Should redirect to dashboard since no training data in sessionStorage
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Training route exists and does not crash', async ({ page }) => {
    await page.goto('/training/test-session');
    // Either redirects to dashboard or shows training UI
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
