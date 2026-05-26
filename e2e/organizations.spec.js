const { test, expect } = require('@playwright/test');

test.describe('Organizations', () => {
  test('Organizations page loads', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.toLowerCase()).toContain('organization');
  });

  test('Create Organization button present', async ({ page }) => {
    await page.goto('/organizations');
    const createBtn = page.locator('button:has-text("Create Organization")').or(page.locator('button[aria-label*="Create"]')).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test('Invite token section visible', async ({ page }) => {
    await page.goto('/organizations');
    // Page has invite token input
    const inviteSection = page.locator('#invite-token').or(page.locator('input[placeholder*="invite" i]')).or(page.locator('input[placeholder*="token" i]')).first();
    await expect(inviteSection).toBeVisible({ timeout: 10000 });
  });
});
