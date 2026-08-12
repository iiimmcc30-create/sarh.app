import { test, expect } from '@playwright/test';

/**
 * Real browser E2E against the running Expo web build.
 * Covers public surfaces: boot, auth phone, market/search entry points.
 * Authenticated payment/posting flows need OTP — covered at live API layer.
 */
test.describe('App web — real browser smoke', () => {
  test('home boots and shows brand / main shell', async ({ page }) => {
    await page.goto('/');
    // Expo web may redirect through onboarding/auth — page must render
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(5);
  });

  test('auth phone screen is reachable', async ({ page }) => {
    await page.goto('/auth/phone');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('textbox', { name: '05xxxxxxxx' })).toBeVisible({
      timeout: 40_000,
    });
  });

  test('market / search routes load without server crash', async ({ page }) => {
    for (const path of ['/search', '/sarh-services', '/butchers', '/subscription', '/fees']) {
      await test.step(path, async () => {
        const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(res?.status() ?? 200).toBeLessThan(500);
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  test('listing detail can open from public feed API id', async ({ page, request }) => {
    const api = process.env.LIVE_API_URL ?? 'http://127.0.0.1:3001';
    const feed = await request.get(`${api}/api/listings?page=1&pageSize=1`);
    expect(feed.ok()).toBeTruthy();
    const json = await feed.json();
    const id = json?.data?.listings?.[0]?.id as string | undefined;
    test.skip(!id, 'no listings in live DB');
    await page.goto(`/listing/${id}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    // Should show some listing content (title/price) once data loads
    await expect(page.getByText(/ر\.س|ريال|SAR|\d+/).first()).toBeVisible({ timeout: 40_000 });
  });
});
