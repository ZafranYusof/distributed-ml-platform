const { test, expect } = require('@playwright/test');

test.describe('RL Playground', () => {
  test('RL Playground page loads', async ({ page }) => {
    await page.goto('/rl-playground');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/reinforcement|rl|playground/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Environment options visible', async ({ page }) => {
    await page.goto('/rl-playground');
    // Page shows environment names: Grid World, Cart Pole, Trading Sim
    const envOption = page.locator('text=/grid world|cart pole|trading/i').first();
    await expect(envOption).toBeVisible({ timeout: 10000 });
  });

  test('Algorithm options visible', async ({ page }) => {
    await page.goto('/rl-playground');
    // Page shows algorithm names: Q-Learning, DQN, REINFORCE
    const algoOption = page.locator('text=/q-learning|dqn|reinforce/i').first();
    await expect(algoOption).toBeVisible({ timeout: 10000 });
  });

  test('Train button present', async ({ page }) => {
    await page.goto('/rl-playground');
    const trainBtn = page.locator('button:has-text("Train"), button:has-text("Start"), button:has-text("Run")').first();
    await expect(trainBtn).toBeVisible({ timeout: 10000 });
  });
});
