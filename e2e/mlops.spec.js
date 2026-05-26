const { test, expect } = require('@playwright/test');

test.describe('MLOps CI/CD', () => {
  test('MLOps CI/CD page loads', async ({ page }) => {
    await page.goto('/mlops-cicd');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/mlops|ci.*cd|pipeline/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Tab navigation visible (deploy/monitor/audit)', async ({ page }) => {
    await page.goto('/mlops-cicd');
    // MLOps page has tabs: deploy, monitor, audit
    const tabs = page.locator('button:has-text("deploy"), button:has-text("monitor"), button:has-text("audit")').first();
    await expect(tabs).toBeVisible({ timeout: 10000 });
  });

  test('Pipeline stages or deployment section visible', async ({ page }) => {
    await page.goto('/mlops-cicd');
    // Pipeline stages (Version, Test, Gate, Deploy, Monitor) or deployment form
    const pipelineSection = page.locator('text=/version|test|gate|deploy|monitor/i').first();
    await expect(pipelineSection).toBeVisible({ timeout: 10000 });
  });
});
