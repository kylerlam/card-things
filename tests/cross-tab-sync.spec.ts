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

test('blocks a stale same-card draft and allows a reviewed retry', async ({ page }) => {
  await page.goto('./?item=orbit-studio');
  const peer = await page.context().newPage();
  await peer.goto('./?item=orbit-studio');
  for (const activePage of [page, peer]) {
    await activePage
      .getByRole('dialog', { name: 'Orbit Studio' })
      .getByRole('button', { name: 'Edit card' })
      .click();
  }
  const staleEditor = page.getByRole('dialog', { name: 'Edit card' });
  const peerEditor = peer.getByRole('dialog', { name: 'Edit card' });
  await staleEditor.getByLabel('Title').fill('Stale Draft Title');
  await peerEditor.getByLabel('Title').fill('Peer Saved Title');
  await peerEditor
    .getByLabel('Short description')
    .fill('The newer peer description must survive a retry.');
  await peerEditor.getByRole('button', { name: 'Save changes' }).click();

  await expect(staleEditor.getByRole('alert')).toContainText(
    'This collection changed in another tab.',
  );
  await expect(staleEditor.getByLabel('Title')).toHaveValue('Stale Draft Title');
  await expect(staleEditor.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await staleEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
  let details = page.getByRole('dialog', { name: 'Peer Saved Title' });
  await expect(details).toContainText('The newer peer description must survive a retry.');
  await details.getByRole('button', { name: 'Edit card' }).click();
  const reviewedEditor = page.getByRole('dialog', { name: 'Edit card' });
  await expect(reviewedEditor.getByRole('alert')).toHaveCount(0);
  await reviewedEditor.getByLabel('Title').fill('Reviewed Retry Title');
  await reviewedEditor.getByRole('button', { name: 'Save changes' }).click();
  details = page.getByRole('dialog', { name: 'Reviewed Retry Title' });
  await expect(details).toContainText('The newer peer description must survive a retry.');
});

test('blocks card drafts after category changes and collection reset', async ({ page }) => {
  await page.goto('./?item=orbit-studio');
  const peer = await page.context().newPage();
  await peer.goto('./');
  await page
    .getByRole('dialog', { name: 'Orbit Studio' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  let staleEditor = page.getByRole('dialog', { name: 'Edit card' });
  await staleEditor.getByLabel('Title').fill('Draft before category change');

  await peer.getByRole('button', { name: 'Manage collection data' }).click();
  await peer.getByRole('button', { name: 'Collection settings' }).click();
  const settings = peer.getByRole('dialog', { name: 'Collection settings' });
  await settings.getByLabel('Name', { exact: true }).last().fill('Peer Category');
  await settings.getByRole('button', { name: 'Add category' }).click();
  await settings.getByRole('button', { name: 'Save settings' }).click();

  await expect(staleEditor.getByRole('alert')).toContainText(
    'This collection changed in another tab.',
  );
  await expect(staleEditor.getByLabel('Title')).toHaveValue('Draft before category change');
  await staleEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Orbit Studio' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  staleEditor = page.getByRole('dialog', { name: 'Edit card' });
  await staleEditor.getByLabel('Title').fill('Draft before reset');

  await peer.getByRole('button', { name: 'Manage collection data' }).click();
  await peer.getByRole('button', { name: 'Restore bundled collection' }).click();
  await peer.getByRole('button', { name: 'Reset collection' }).click();
  await expect(staleEditor.getByRole('alert')).toContainText(
    'This collection changed in another tab.',
  );
  await expect(staleEditor.getByLabel('Title')).toHaveValue('Draft before reset');
  await expect(staleEditor.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await staleEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Orbit Studio' })).toContainText(
    'A calmer space to shape your next idea.',
  );
});

test('cancels a pending image save after an external card update and retries cleanly', async ({
  page,
}) => {
  let markImageRequested!: () => void;
  const imageRequested = new Promise<void>((resolve) => {
    markImageRequested = resolve;
  });
  let releaseImage!: () => void;
  const imageRelease = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  await page.route('**/images/delayed-cover.png', async (route) => {
    markImageRequested();
    await imageRelease;
    await route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
  await page.goto('./?item=orbit-studio');
  const peer = await page.context().newPage();
  await peer.goto('./?item=orbit-studio');
  for (const activePage of [page, peer]) {
    await activePage
      .getByRole('dialog', { name: 'Orbit Studio' })
      .getByRole('button', { name: 'Edit card' })
      .click();
  }
  const pendingEditor = page.getByRole('dialog', { name: 'Edit card' });
  await pendingEditor.getByLabel('Image path').fill('images/delayed-cover.png');
  await pendingEditor.getByLabel('Image description').fill('A delayed local cover');
  await pendingEditor.getByRole('button', { name: 'Save changes' }).click();
  await imageRequested;
  await expect(pendingEditor.getByText('Checking the local cover image')).toBeVisible();

  const peerEditor = peer.getByRole('dialog', { name: 'Edit card' });
  await peerEditor.getByLabel('Title').fill('Peer Update During Check');
  await peerEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(pendingEditor.getByRole('alert')).toContainText(
    'This collection changed in another tab.',
  );
  await pendingEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Peer Update During Check' })).toBeVisible();
  releaseImage();
  await page.waitForTimeout(100);

  let stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cardthings:collection:v1') || '{}').items?.find(
      (item: { id: string }) => item.id === 'orbit-studio',
    ),
  );
  expect(stored.title).toBe('Peer Update During Check');
  expect(stored.image.src).toBe('images/collection-covers.webp');

  await page
    .getByRole('dialog', { name: 'Peer Update During Check' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  const retryEditor = page.getByRole('dialog', { name: 'Edit card' });
  await retryEditor.getByLabel('Image path').fill('images/delayed-cover.png');
  await retryEditor.getByLabel('Image description').fill('A delayed local cover');
  await retryEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog', { name: 'Peer Update During Check' })).toBeVisible();
  stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cardthings:collection:v1') || '{}').items?.find(
      (item: { id: string }) => item.id === 'orbit-studio',
    ),
  );
  expect(stored.image.src).toBe('images/delayed-cover.png');
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
