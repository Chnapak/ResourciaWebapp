import { expect, test } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/ResourciaFrontend/i);
  await expect(page.locator('app-root')).toBeVisible();
});
