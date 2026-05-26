const { test, expect } = require('@playwright/test');

test.describe('Experiments', () => {
  test('Experiments page loads', async ({ page }) => {
    await page.goto('/experiments');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('experiment');
  });

  test('Shows experiments UI or sign-in prompt', async ({ page }) => {
    await page.goto('/experiments');
    // Without auth shows "Sign in to track experiments"
    const signIn = page.getByText('Sign in to track experiments');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    const content = signIn.or(searchInput);
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Page has meaningful content', async ({ page }) => {
    await page.goto('/experiments');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
