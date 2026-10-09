import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

async function openData(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Manage collection data' }).click();
  await expect(page.getByRole('dialog', { name: 'Collection data' })).toBeVisible();
}

async function importJson(page: import('@playwright/test').Page, value: unknown) {
  await page.getByLabel('Import collection JSON').setInputFiles({
    name: 'collection.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(value)),
  });
}

test('validates imports before replacing the active collection', async ({ page }) => {
  await page.goto('./');
  await openData(page);
  await importJson(page, { title: 'Incomplete' });
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Collection not imported');
  await expect(alert).toContainText('categories: must be an array');
  await page.getByRole('button', { name: 'Close collection data' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  await expect(page.locator('.collection-card')).toHaveCount(12);
});

test('imports a collection, normalizes its view, and restores it after reload', async ({
  page,
}) => {
  await page.goto('./?q=orbit&category=tools&sort=title');
  await openData(page);
  await importJson(page, importedCollection);
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Imported 1 items');
  await expect(page.getByRole('dialog').getByText('Imported JSON', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close collection data' }).click();
  await expect(page).toHaveURL(/\?sort=title$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portable Notes');
  await expect(page.getByRole('button', { name: 'View First Note' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portable Notes');
  await expect(page.locator('.collection-card')).toHaveCount(1);
});

test('exports the exact active collection and resets with confirmation', async ({ page }) => {
  await page.goto('./');
  await openData(page);
  await importJson(page, importedCollection);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('portable-notes.json');
  expect(JSON.parse(readFileSync((await download.path())!, 'utf8'))).toEqual(importedCollection);
  await page.getByRole('button', { name: 'Restore bundled collection' }).click();
  await expect(page.getByText('Replace the imported collection')).toBeVisible();
  await page.getByRole('button', { name: 'Reset collection' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText(
    'Restored the bundled example collection',
  );
  await page.getByRole('button', { name: 'Close collection data' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  await page.reload();
  await expect(page.locator('.collection-card')).toHaveCount(12);
});

test('keeps a valid import available for the visit when storage is unavailable', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await openData(page);
  await importJson(page, importedCollection);
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('for this visit');
  await page.getByRole('button', { name: 'Close collection data' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portable Notes');
  await expect(page.getByText('Collection changes are available for this visit')).toBeVisible();
});
