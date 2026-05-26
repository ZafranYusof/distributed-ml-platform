const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('Register page loads and shows form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#reg-username')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
  });

  test('Login page loads and shows form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('Register page has submit button', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login page has submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login page has link to register', async ({ page }) => {
    await page.goto('/login');
    // It's a button that navigates to /register, text is "Create one"
    await expect(page.locator('button:has-text("Create one")')).toBeVisible();
  });

  test('Register page has link to login', async ({ page }) => {
    await page.goto('/register');
    // It's a button that navigates to /login, text is "Sign in"
    await expect(page.locator('button:has-text("Sign in"), button:has-text("sign in"), button:has-text("Log in")')).toBeVisible();
  });
});
