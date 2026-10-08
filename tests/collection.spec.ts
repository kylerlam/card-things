import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const cards = '.collection-card';

test('loads the collection without runtime errors or third-party requests', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      external.push(request.url());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('CardThings — A home for good finds');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  const image = await page.request.get('/images/collection-covers.png');
  expect(image.ok()).toBe(true);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('combines normalized search and category filters', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search collection' }).fill('  DESIGN  ');
  await expect(page.locator(cards)).toHaveCount(2);
  await page
    .getByRole('group', { name: 'Filter by category' })
    .getByRole('button', { name: 'Tools', exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View Orbit Studio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator(cards)).toHaveCount(3);
  await expect(page.getByRole('searchbox')).toBeFocused();
});

test('handles empty, whitespace, and zero-match combinations', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  await search.fill('   ');
  await expect(page.locator(cards)).toHaveCount(12);
  await search.fill('orbit');
  await page
    .getByRole('group', { name: 'Filter by category' })
    .getByRole('button', { name: 'Reading', exact: true })
    .click();
  await expect(page.locator(cards)).toHaveCount(0);
  await expect(page.getByText('Nothing here just yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator(cards)).toHaveCount(12);
  await expect(search).toHaveValue('');
  await search.fill('no-such-resource-xyz');
  await expect(page.getByRole('status').first()).toHaveText('0 items');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator(cards)).toHaveCount(12);
});

test('sorts titles and returns to recent order', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Sort items').selectOption('title');
  await expect(page.locator(cards).first()).toContainText('A Growing Archive');
  await page.getByLabel('Sort items').selectOption('recent');
  await expect(page.locator(cards).first()).toContainText('Orbit Studio');
});

test('favorites survive reload and repeated toggles remain consistent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Favorites 0', exact: true }).click();
  await expect(page.getByText('A place for your favorites.')).toBeVisible();
  await page.getByRole('button', { name: 'Explore all items' }).click();
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(1);
  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(0);
  await expect(page.getByText('A place for your favorites.')).toBeVisible();
});

test('detail opens repeatedly, closes by button and Escape, and restores focus', async ({
  page,
}) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'View Orbit Studio', exact: true });
  for (let i = 0; i < 3; i++) {
    await open.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Orbit Studio', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
    if (i === 1) await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Close details' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(open).toBeFocused();
  }
});

test('detail traps keyboard focus, supports favorites, and closes on backdrop', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Save to favorites' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Saved to favorites' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toBeVisible();
});

test('keyboard search shortcut and Enter activate details', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.type('orbit');
  await expect(page.locator(cards)).toHaveCount(1);
  const open = page.getByRole('button', { name: 'View Orbit Studio', exact: true });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
});

test('no horizontal overflow at narrow and wide sizes, including details', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
    const dialog = page.getByRole('dialog');
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Close details' }).click();
  }
});

test('collection and dialog pass automated accessibility checks', async ({ page }) => {
  await page.goto('/');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('invalid or unavailable storage does not break the collection', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cardthings:favorites:v1', '{bad-json'));
  await page.goto('/');
  await expect(page.locator(cards)).toHaveCount(12);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await expect(
    page.getByText('Favorites are available for this visit.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('removing the last favorite from details restores a usable empty collection', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Favorites 1', exact: true }).click();
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Saved to favorites' }).click();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByText('A place for your favorites.')).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button', { name: 'Explore all items' }).click();
  await expect(page.locator(cards)).toHaveCount(12);
});
