import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const cards = '.collection-card';

test('removable filters clear without leaving favorites or resetting sort', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorite Quiet Spaces', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 2', exact: true }).click();
  await page.getByLabel('Sort items').selectOption('title');
  await page.getByRole('searchbox').fill('orbit');
  await page
    .getByRole('group', { name: 'Filter by category' })
    .getByRole('button', { name: 'Tools', exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove category filter' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('orbit');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page.getByLabel('Sort items')).toHaveValue('title');
  await expect(page).toHaveURL(/view=favorites&sort=title$/);
  await page.getByRole('searchbox').fill('missing');
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page).toHaveURL(/view=favorites&sort=title$/);
});

test('long active filters wrap within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('./?q=' + 'x'.repeat(200) + '&category=tools');
  await expect(page.getByRole('button', { name: 'Remove search filter' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Remove search filter' }).click();
  await expect(page.locator(cards)).toHaveCount(3);
});

test('tag filters compose, restore from links, and clear independently', async ({ page }) => {
  await page.goto('./');
  const card = page.locator(cards).filter({ hasText: 'Orbit Studio' });
  await card.getByRole('button', { name: 'Filter by tag Design', exact: true }).click();
  await expect(page).toHaveURL(/tag=Design$/);
  const count = await page.locator(cards).count();
  expect(count).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator(cards)).toHaveCount(count);
  await page
    .getByRole('group', { name: 'Filter by category' })
    .getByRole('button', { name: 'Tools', exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(1);
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.goto('./?category=tools&tag=Design&view=favorites');
  await expect(page.locator(cards)).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove tag filter' }).click();
  await expect(page).toHaveURL(/category=tools&view=favorites$/);
  await page.goto('./?tag=unknown');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(cards)).toHaveCount(12);
});

test('extra sort orders restore through refresh and browser history', async ({ page }) => {
  await page.goto('./?category=tools');
  const titles = async () => page.locator('.card-copy h2').allTextContents();
  await page.getByLabel('Sort items').selectOption('title');
  const ascending = await titles();
  await page.getByLabel('Sort items').selectOption('title-desc');
  await expect(page).toHaveURL(/category=tools&sort=title-desc$/);
  expect(await titles()).toEqual([...ascending].reverse());
  await page.reload();
  await expect(page.getByLabel('Sort items')).toHaveValue('title-desc');
  await page.getByLabel('Sort items').selectOption('oldest');
  await expect(page).toHaveURL(/category=tools&sort=oldest$/);
  const oldest = await titles();
  await page.getByLabel('Sort items').selectOption('recent');
  expect(await titles()).toEqual([...oldest].reverse());
  await page.goBack();
  await expect(page.getByLabel('Sort items')).toHaveValue('oldest');
  await page.goForward();
  await expect(page.getByLabel('Sort items')).toHaveValue('recent');
});

test('list layout retains card actions and restores from a shareable URL', async ({ page }) => {
  await page.goto('./?category=tools&sort=title');
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page).toHaveURL(/category=tools&sort=title&layout=list$/);
  await expect(page.locator('.card-list')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'List view', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.locator('.card-list')).toBeVisible();
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await expect(page.locator('.card-list')).toHaveCount(0);
  await expect(page).toHaveURL(/category=tools&sort=title$/);
});

test('list layout stays usable at narrow and wide sizes', async ({ page }) => {
  await page.goto('./?layout=list');
  for (const width of [320, 390, 768, 1024, 1440, 1800]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(cards)).toHaveCount(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(
      page.getByRole('button', { name: 'View Orbit Studio', exact: true }),
    ).toBeVisible();
  }
});

test('detail navigation follows results and closes once into the original view', async ({
  page,
}) => {
  await page.goto('./?category=tools&sort=title');
  const titles = await page.locator('.card-copy h2').allTextContents();
  const first = page.locator('.card-open').first();
  await first.click();
  const length = await page.evaluate(() => history.length);
  await expect(page.getByRole('button', { name: 'Previous item', exact: true })).toBeDisabled();
  for (let index = 1; index < titles.length; index++) {
    await page.getByRole('button', { name: 'Next item', exact: true }).click();
    await expect(page.locator('#detail-title')).toHaveText(titles[index]);
    await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  }
  await expect(page.getByRole('button', { name: 'Next item', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/category=tools&sort=title$/);
  await expect(first).toBeFocused();
  await page.goForward();
  await expect(page.locator('#detail-title')).toHaveText(titles[titles.length - 1]);
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('direct shared details navigate without leaving the collection when closed', async ({
  page,
}) => {
  await page.goto('./?category=tools&item=orbit-studio');
  const length = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: 'Next item', exact: true }).click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/category=tools$/);
  expect(await page.evaluate(() => history.length)).toBe(length);
  await expect(page.locator('main')).toBeFocused();
  await page.goto('./?q=missing&item=orbit-studio');
  await expect(page.getByRole('navigation', { name: 'Browse filtered items' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/q=missing$/);
});

test('detail navigation clears stale manual-copy state when revisiting an item', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('unavailable');
        },
      },
    });
  });
  await page.goto('./?category=tools');
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Copy item link', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Shareable link' })).toBeVisible();
  await page.getByRole('button', { name: 'Next item', exact: true }).click();
  await page.getByRole('button', { name: 'Previous item', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Shareable link' })).toHaveCount(0);
});

test('favorites export and import round-trip without replacing current saved items', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export favorites', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('cardthings-favorites.json');
  const backup = readFileSync((await download.path())!);
  expect(JSON.parse(backup.toString())).toEqual({ version: 1, favorites: ['orbit-studio'] });
  await page.goto('./');
  await page.getByRole('button', { name: 'Favorite Quiet Spaces', exact: true }).click();
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  for (let attempt = 0; attempt < 2; attempt++) {
    await page
      .getByLabel('Favorites backup file')
      .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
    await expect(page.locator(cards)).toHaveCount(2);
  }
  await page.reload();
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: 'Unfavorite Quiet Spaces', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toBeVisible();
});

test('invalid and oversized backups leave saved favorites intact', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.goto('./?view=favorites');
  const input = page.getByLabel('Favorites backup file');
  await input.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":2,"favorites":[]}'),
  });
  await expect(
    page.getByRole('status').filter({ hasText: 'This favorites backup version is not supported.' }),
  ).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(1);
  await input.setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(1024 * 1024 + 1),
  });
  await expect(page.getByRole('status').filter({ hasText: '1 MB or smaller' })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(1);
  await input.setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"favorites":["unknown","quiet-spaces"]}'),
  });
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page.getByRole('status').filter({ hasText: '1 matching favorites' })).toBeVisible();
});

test('delayed imports merge against the latest per-visit favorites after storage failure', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('unavailable');
    };
    Storage.prototype.setItem = () => {
      throw new Error('unavailable');
    };
    File.prototype.text = function () {
      return new Promise<string>((resolve) => {
        Object.defineProperty(window, 'finishBackupRead', { configurable: true, value: resolve });
      });
    };
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  await page.getByLabel('Favorites backup file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await expect.poll(() => page.evaluate(() => 'finishBackupRead' in window)).toBe(true);
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(0);
  await page.evaluate(() => {
    const finish = Reflect.get(window, 'finishBackupRead') as (text: string) => void;
    finish('{"version":1,"favorites":["quiet-spaces"]}');
  });
  await expect(page.locator(cards)).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Unfavorite Quiet Spaces', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveCount(0);
});
