const { test, expect } = require('@playwright/test');

test.describe('Datasets', () => {
  test('Datasets page loads', async ({ page }) => {
    await page.goto('/datasets');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('dataset');
  });

  test('Page shows dataset management UI or sign-in', async ({ page }) => {
    await page.goto('/datasets');
    // Either shows "Upload Dataset" button or "Sign in to manage datasets"
    const uploadBtn = page.locator('button:has-text("Upload")');
    const signIn = page.getByText(/sign in/i);
    const content = uploadBtn.or(signIn).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Page renders meaningful content', async ({ page }) => {
    await page.goto('/datasets');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
