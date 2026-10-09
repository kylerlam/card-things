import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const collectionKey = 'cardthings:collection:v1';
const favoritesKey = 'cardthings:favorites:v1';
const importedCollection = {
  title: 'Portable Notes',
  description: 'A collection loaded from a local JSON file.',
  example: false,
  categories: [{ id: 'notes', label: 'Notes', color: '#234e70' }],
  items: [
    {
      id: 'first-note',
      title: 'First Note',
      category: 'notes',
      description: 'A portable collection entry.',
      details: 'This entry verifies browser-local collection import and export.',
      tags: ['Portable'],
      added: '2026-10-09',
      image: { src: 'favicon.svg', alt: 'Two overlapping cards' },
    },
  ],
};

async function importCollection(page: Page) {
  await page.getByRole('button', { name: 'Manage collection data' }).click();
  await page.getByLabel('Import collection JSON').setInputFiles({
    name: 'collection.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedCollection)),
  });
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Imported 1 items');
}

test('synchronizes favorite changes without writing them back', async ({ page }) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./');
  await page.evaluate(() => {
    (window as typeof window & { returnedStorageEvents: number }).returnedStorageEvents = 0;
    window.addEventListener('storage', () => {
      (window as typeof window & { returnedStorageEvents: number }).returnedStorageEvents += 1;
    });
  });

  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  await expect(peer.getByRole('button', { name: 'Favorites 1', exact: true })).toBeVisible();
  await expect(peer.getByText('Favorites updated from another tab.')).toBeVisible();
  await expect(
    peer.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    (
      await new AxeBuilder({ page: peer })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }).click();
  await expect(peer.getByRole('button', { name: 'Favorites 0', exact: true })).toBeVisible();
  await expect(peer.getByText('Favorites cleared from another tab.')).toBeVisible();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).returnedStorageEvents)).toBe(0);
});

test('synchronizes collection import and reset while canonicalizing the active view', async ({
  page,
}) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./?q=orbit&category=tools&sort=title&item=orbit-studio');
  await expect(peer.getByRole('dialog', { name: 'Orbit Studio' })).toBeVisible();

  await importCollection(page);
  await expect(peer.getByRole('heading', { level: 1 })).toHaveText('Portable Notes');
  await expect(peer.getByText('Collection updated from another tab.')).toBeVisible();
  await expect(peer.getByRole('dialog')).toHaveCount(0);
  await expect(peer).toHaveURL(/\?q=orbit&sort=title$/);
  await expect(peer.getByRole('button', { name: 'All items 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.getByRole('button', { name: 'Restore bundled collection' }).click();
  await page.getByRole('button', { name: 'Reset collection' }).click();
  await expect(peer.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  await expect(peer.getByText('Bundled collection restored from another tab.')).toBeVisible();
  await expect(peer).toHaveURL(/\?q=orbit&sort=title$/);
  await expect(peer.getByRole('button', { name: 'View Orbit Studio' })).toBeVisible();
});

test('synchronizes cards created and edited in the local workspace', async ({ page }) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./');

  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Add a card' });
  await editor.getByLabel('Title').fill('Shared Field Notes');
  await editor.getByLabel('Category').selectOption('tools');
  await editor.getByLabel('Short description').fill('Created in one open browser tab.');
  await editor.getByLabel('Details').fill('The peer tab should receive this saved card.');
  await editor.getByRole('button', { name: 'Add card', exact: true }).click();

  await expect(peer.getByText('Collection updated from another tab.')).toBeVisible();
  await expect(peer.getByRole('button', { name: 'View Shared Field Notes' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Shared Field Notes' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  const edit = page.getByRole('dialog', { name: 'Edit card' });
  await edit.getByLabel('Title').fill('Shared Research Notes');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(peer.getByRole('button', { name: 'View Shared Field Notes' })).toHaveCount(0);
  await expect(peer.getByRole('button', { name: 'View Shared Research Notes' })).toBeVisible();
  await expect(peer.locator('.collection-card')).toHaveCount(13);
});

test('clears an obsolete local save notice after an external collection replacement', async ({
  page,
}) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./');

  await page.getByRole('button', { name: 'Manage collection data' }).click();
  await page.getByRole('button', { name: 'Collection settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Collection settings' });
  await settings.getByLabel('Title').fill('Temporary Shared Shelf');
  await settings.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Collection settings saved in this browser.')).toBeVisible();

  await peer.getByRole('button', { name: 'Manage collection data' }).click();
  await peer.getByRole('button', { name: 'Restore bundled collection' }).click();
  await peer.getByRole('button', { name: 'Reset collection' }).click();
  await expect(page.getByText('Bundled collection restored from another tab.')).toBeVisible();
  await expect(page.getByText('Collection settings saved in this browser.')).toHaveCount(0);
});

test('ignores malformed external values without disrupting active state', async ({ page }) => {
  await page.goto('./?category=tools&item=orbit-studio');
  const peer = await page.context().newPage();
  await peer.goto('./');
  await page.getByRole('button', { name: 'Save to favorites' }).click();
  await peer.evaluate(() => {
    (window as typeof window & { returnedStorageEvents: number }).returnedStorageEvents = 0;
    window.addEventListener('storage', () => {
      (window as typeof window & { returnedStorageEvents: number }).returnedStorageEvents += 1;
    });
    localStorage.setItem('cardthings:collection:v1', '{bad-json');
    localStorage.setItem('cardthings:favorites:v1', JSON.stringify({ favorite: 'orbit-studio' }));
  });

  await expect(
    page.getByText('Invalid collection data from another tab was ignored.'),
  ).toBeVisible();
  await expect(
    page.getByText('Invalid favorites data from another tab was ignored.'),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Orbit Studio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saved to favorites' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/\?category=tools&item=orbit-studio$/);
  await peer.waitForTimeout(200);
  expect(await peer.evaluate(() => (window as any).returnedStorageEvents)).toBe(0);
});

test('syncs from event payloads when local access fails and handles clear', async ({ page }) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./');
  await page.evaluate(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage unavailable');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
    Storage.prototype.removeItem = () => {
      throw new Error('Storage unavailable');
    };
  });

  await importCollection(peer);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portable Notes');
  await peer.getByRole('button', { name: 'Close collection data' }).click();
  await peer.getByRole('button', { name: 'Favorite First Note', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorites 1', exact: true })).toBeVisible();

  await peer.evaluate(() => localStorage.clear());
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  await expect(page.getByRole('button', { name: 'Favorites 0', exact: true })).toBeVisible();
  await expect(page.getByText('Bundled collection restored from another tab.')).toBeVisible();
  await expect(page.getByText('Favorites cleared from another tab.')).toBeVisible();

  expect(await peer.evaluate((key) => localStorage.getItem(key), collectionKey)).toBeNull();
  expect(await peer.evaluate((key) => localStorage.getItem(key), favoritesKey)).toBeNull();
});
