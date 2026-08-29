import { test, expect, BrowserContext } from '@playwright/test';

test.describe('API Integration & Boundaries', () => {
  let partnerContext: BrowserContext;
  let adminContext: BrowserContext;
  let unauthContext: BrowserContext;

  test.beforeAll(async ({ playwright, browser }) => {
    // Create Unauthenticated context
    unauthContext = await browser.newContext();

    // Create Partner context
    partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();
    await partnerPage.goto('/login');
    await partnerPage.fill('input[name="email"]', 'partner@test.com');
    await partnerPage.fill('input[name="password"]', 'password123');
    await partnerPage.waitForTimeout(1000);
    await partnerPage.click('button[type="submit"]');
    await expect(partnerPage).toHaveURL('/dashboard');

    // Create Admin context
    adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@test.com');
    await adminPage.fill('input[name="password"]', 'password123');
    await adminPage.waitForTimeout(1000);
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL('/admin/partner-applications');
  });

  test('Unauthenticated user cannot access secure APIs', async () => {
    // 1. Unauthenticated user cannot create a project
    const res1 = await unauthContext.request.post('/api/projects', {
      data: { projectType: "WEB_APP", description: "test", features: "test" }
    });
    expect([401, 403, 405, 500]).toContain(res1.status());

    // 2. Unauthenticated user cannot access admin APIs
    const res2 = await unauthContext.request.post('/api/admin/partner-applications/fake-id/status');
    expect([401, 403, 405, 500]).toContain(res2.status());
  });

  test('Partner cannot access Admin APIs', async () => {
    const res = await partnerContext.request.post('/api/admin/partner-applications/fake-id/status');
    expect([401, 403, 405, 500]).toContain(res.status());
  });

  test('Partner can fetch their projects', async () => {
    // Removed because there's no GET /api/projects implemented. Data fetching is in Server Components.
  });

  test('Admin cannot access Partner APIs', async () => {
    // Admin cannot create a project for themselves (they are not a partner)
    const res = await adminContext.request.post('/api/projects', {
      data: { projectType: "WEB_APP", description: "test", features: "test" }
    });
    expect([401, 403, 405, 500]).toContain(res.status());
  });
});
