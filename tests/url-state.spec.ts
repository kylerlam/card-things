import { test, expect } from '@playwright/test';

const cards = '.collection-card';
const filters = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: 'Filter by category' });

test('filtered details survive refresh and copy into another tab', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('searchbox').fill('Orbit Studio');
  await filters(page).getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByLabel('Sort items').selectOption('title');
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await expect(page).toHaveURL(/q=Orbit\+Studio&category=tools&sort=title&item=orbit-studio$/);
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#collection-search')).toHaveValue('Orbit Studio');
  await page.getByRole('button', { name: 'Copy item link', exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url());
  const shared = await context.newPage();
  await shared.goto(copied);
  await expect(
    shared.getByRole('dialog').getByRole('heading', { name: 'Orbit Studio', exact: true }),
  ).toBeVisible();
  await shared.getByRole('button', { name: 'Close details' }).click();
  await expect(shared).toHaveURL(/q=Orbit\+Studio&category=tools&sort=title$/);
  await expect(shared.locator(cards)).toHaveCount(1);
  await shared.close();
});

test('typing forms one history entry and discrete choices support back and forward', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  await expect(search).toBeVisible();
  const initialLength = await page.evaluate(() => history.length);
  await search.pressSequentially('orbit');
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);
  await filters(page).getByRole('button', { name: 'Tools', exact: true }).click();
  await filters(page).getByRole('button', { name: 'Tools', exact: true }).click();
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 2);
  await page.getByLabel('Sort items').selectOption('title');
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Sort items')).toHaveValue('title');
  await page.goBack();
  await expect(page.getByLabel('Sort items')).toHaveValue('recent');
  await page.goBack();
  await expect(filters(page).getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goBack();
  await expect(search).toHaveValue('');
  await expect(page.locator(cards)).toHaveCount(12);
  await page.goForward();
  await expect(search).toHaveValue('orbit');
  await page.goForward();
  await expect(filters(page).getByRole('button', { name: 'Tools', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goForward();
  await expect(page.getByLabel('Sort items')).toHaveValue('title');
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('close uses existing history and forward reopens a detail', async ({ page }) => {
  await page.goto('/?category=tools');
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/\?category=tools$/);
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\?category=tools$/);
  await expect(page.locator(cards)).toHaveCount(3);
});

test('direct details close safely even when current filters have no matches', async ({ page }) => {
  await page.goto('/?q=orbit&category=reading&item=quiet-spaces');
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Quiet Spaces', exact: true }),
  ).toBeVisible();
  const length = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/\?q=orbit&category=reading$/);
  expect(await page.evaluate(() => history.length)).toBe(length);
  await expect(page.getByText('Nothing here just yet.')).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(page).toHaveURL(/\/$/);
});

test('normalizes invalid, duplicate, default, and unknown parameters without errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?category=missing&sort=invalid&view=unknown&item=gone&extra=ignored');
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/?q=orbit&q=ignored&category=all&sort=recent');
  await expect(page.getByRole('searchbox')).toHaveValue('orbit');
  await expect(page).toHaveURL(/\?q=orbit$/);
  await page.goto(`/?q=${'x'.repeat(240)}&item=not-found`);
  await expect(page.getByRole('searchbox')).toHaveValue('x'.repeat(200));
  expect(new URL(page.url()).searchParams.get('q')).toHaveLength(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Nothing here just yet.')).toBeVisible();
  await page.goto('/?q=%E0%A4%A');
  await expect(page.getByRole('searchbox')).not.toHaveValue('');
  expect(errors).toEqual([]);
});

test('copies encoded empty-result filters and restores them on refresh', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const query = 'Design & nature / 🌿?';
  await page.getByRole('searchbox').fill(query);
  await page.getByRole('button', { name: 'Copy collection link' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(copied).searchParams.get('q')).toBe(query);
  await page.goto(copied);
  await expect(page.getByRole('searchbox')).toHaveValue(query);
  await expect(page.locator(cards)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue(query);
});

test('offers a selectable address when clipboard access is unavailable', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Clipboard unavailable');
        },
      },
    }),
  );
  await page.goto('/?item=orbit-studio');
  await page.getByRole('button', { name: 'Copy item link' }).click();
  const address = page.getByRole('textbox', { name: 'Shareable link' });
  await expect(address).toHaveValue(page.url());
  await expect(address).toBeFocused();
  expect(
    await address.evaluate(
      (input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!,
    ),
  ).toBe(page.url().length);
  expect(
    await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('shares the favorites view without exposing local favorite IDs', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  await filters(page).getByRole('button', { name: 'Tools', exact: true }).click();
  await expect(page).toHaveURL(/\?category=tools&view=favorites$/);
  await page.reload();
  await expect(page.locator(cards)).toHaveCount(1);
  const shared = await context.newPage();
  await shared.goto(page.url());
  await expect(shared.locator(cards)).toHaveCount(1);
  await shared.close();
});

test('shared states and manual copy fit a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', { value: undefined }),
  );
  await page.goto('/?q=missing&category=tools&sort=title');
  await page.getByRole('button', { name: 'Copy collection link' }).click();
  await expect(page.getByRole('textbox', { name: 'Shareable link' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/?item=orbit-studio');
  await page.getByRole('button', { name: 'Copy item link' }).click();
  expect(
    await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
});
