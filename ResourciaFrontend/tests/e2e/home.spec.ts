import { expect, test } from '@playwright/test';

type MockRoute = {
  fulfill: (response: {
    status: number;
    contentType: string;
    body: string;
  }) => Promise<unknown>;
};

test('home loads', async ({ page }) => {
  await page.route('**/api/Search/Schema', async (route: MockRoute) => {
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
