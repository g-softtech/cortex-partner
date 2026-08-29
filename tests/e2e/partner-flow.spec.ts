import { test, expect } from '@playwright/test';

test.describe('Partner E2E Flow', () => {
  test('Partner can log in, view dashboard, and submit a project', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'partner@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.waitForTimeout(1000); // Wait for React hydration
    await page.click('button[type="submit"]');

    // 2. Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');

    // 3. Navigate to New Project
    await page.click('a[href="/projects/new"]');
    await expect(page).toHaveURL('/projects/new');

    // 4. Fill and submit project
    await page.selectOption('select[name="projectType"]', 'WEB_APP');
    await page.fill('textarea[name="description"]', 'A test project for Playwright E2E.');
    await page.fill('textarea[name="features"]', 'User Auth, Payment Gateway');
    await page.fill('input[name="budget"]', '10000');
    await page.fill('input[name="timeline"]', '2 months');
    await page.click('button[type="submit"]');

    // 5. Verify submission success
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator('text=A test project for Playwright E2E.')).toBeVisible();
  });

  test('Partner cannot access admin routes', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'partner@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.waitForTimeout(1000); // Wait for React hydration
    await page.click('button[type="submit"]');

    // 2. Attempt to visit Admin dashboard
    await page.goto('/admin/projects');
    
    // 3. Should redirect back to partner dashboard or login
    await expect(page).not.toHaveURL('/admin/projects');
  });
});
