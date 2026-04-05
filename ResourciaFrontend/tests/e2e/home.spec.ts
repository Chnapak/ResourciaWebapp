import { expect, test } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.route('**/api/Search/Schema', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ filters: [] }),
    });
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/Home|ResourciaFrontend/i);
  await expect(page.locator('app-root')).toBeVisible();
});
