import { test, expect } from '@playwright/test';

test.describe('Admin E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  });

  test('Admin can log in and view projects', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.waitForTimeout(1000); // Wait for React hydration
    await page.click('button[type="submit"]');

    // 2. Verify redirect to admin partner-applications list
    await expect(page).toHaveURL('/admin/partner-applications');
    await expect(page.locator('h1')).toContainText('Partner Applications');
  });

  test('Admin cannot access partner routes', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.waitForTimeout(1000); // Wait for React hydration
    await page.click('button[type="submit"]');

    // 2. Attempt to visit Partner dashboard
    await page.goto('/dashboard');
    
    // 3. Should redirect back to admin or login
    await expect(page).not.toHaveURL('/dashboard');
  });
});
