import { test, expect } from '@playwright/test';

test('favorites synchronize additions, removals, and storage clearing across tabs', async ({
  page,
  context,
}) => {
  await page.goto('./');
  const other = await context.newPage();
  await other.goto('./');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await expect(
    other.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await other.getByRole('button', { name: 'Favorite Quiet Spaces', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await expect(
    other.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByRole('button', { name: 'Favorites 0', exact: true })).toBeVisible();
});

test('toggles merge the latest saved IDs rather than overwriting a stale view', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.setItem(
      'cardthings:favorites:v1',
      JSON.stringify(['quiet-spaces', 'quiet-spaces', 'missing', 3]),
    );
  });
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 2', exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cardthings:favorites:v1')!)),
  ).toEqual(['quiet-spaces', 'orbit-studio']);
});

test('unavailable storage is explained before the first favorite action', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage unavailable');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await page.goto('./');
  await expect(
    page.getByText('Favorites are available for this visit.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorite Quiet Spaces', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 1', exact: true })).toBeVisible();
});

test('failed writes keep per-visit favorites when another tab changes storage', async ({
  page,
  context,
}) => {
  await page.goto('./');
  const other = await context.newPage();
  await other.goto('./');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
    window.addEventListener(
      'storage',
      () => {
        document.body.dataset.storageChanged = 'true';
      },
      { once: true },
    );
  });
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await other.getByRole('button', { name: 'Favorite Quiet Spaces', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-storage-changed', 'true');
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Favorite The Art of Noticing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 2', exact: true })).toBeVisible();
});
