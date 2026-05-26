const { test, expect } = require('@playwright/test');

test.describe('Federated Learning', () => {
  test('Federated Learning page loads', async ({ page }) => {
    await page.goto('/federated');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('federated');
  });

  test('Shows federated UI or sign-in prompt', async ({ page }) => {
    await page.goto('/federated');
    // Without auth shows "Sign in to use Federated Learning"
    const signIn = page.getByText('Sign in to use Federated Learning');
    const inputs = page.locator('input[type="number"]').first();
    const content = signIn.or(inputs);
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Page has meaningful content', async ({ page }) => {
    await page.goto('/federated');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
