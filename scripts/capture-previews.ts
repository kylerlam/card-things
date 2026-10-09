import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createStarterCollection } from '../src/lib/starterCollection.ts';

const baseUrl = process.env.CARDTHINGS_PREVIEW_URL || 'http://127.0.0.1:4173/';
const output = fileURLToPath(new URL('../docs/previews/', import.meta.url));

await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await desktop.goto(baseUrl);
  await desktop.evaluate(() => localStorage.clear());
  await desktop.reload();
  await desktop.screenshot({ path: `${output}collection-desktop.png` });

  await desktop.getByRole('button', { name: 'Add card', exact: true }).click();
  const desktopEditor = desktop.getByRole('dialog', { name: 'Add a card' });
  await desktopEditor.getByLabel('Title').fill('Field Notes');
  await desktopEditor.getByLabel('Category').selectOption('tools');
  await desktopEditor
    .getByLabel('Short description')
    .fill('A practical reference added directly in the browser.');
  await desktopEditor
    .getByLabel('Details')
    .fill('Keep the useful context, instructions, and next steps together.');
  await desktopEditor.getByLabel('Tags (optional)').fill('Research, Reference');
  await desktopEditor.getByLabel('Title').focus();
  await desktop.screenshot({ path: `${output}card-editor-desktop.png` });
  await desktopEditor.getByRole('button', { name: 'Cancel', exact: true }).click();

  await desktop.getByRole('button', { name: 'View Orbit Studio' }).click();
  await desktop.screenshot({ path: `${output}item-detail-desktop.png` });
  await desktop.getByRole('button', { name: 'Close details' }).click();

  await desktop.getByRole('button', { name: 'Manage collection data' }).click();
  await desktop.screenshot({ path: `${output}collection-data-desktop.png` });
  await desktop.getByRole('button', { name: 'Collection settings' }).click();
  const desktopSettings = desktop.getByRole('dialog', { name: 'Collection settings' });
  await desktopSettings.getByLabel('Title').fill('Useful things, kept together.');
  await desktopSettings
    .getByRole('group', { name: 'Category 1' })
    .getByLabel('Name')
    .fill('Utilities');
  await desktopSettings.getByLabel('Title').focus();
  await desktop.screenshot({ path: `${output}collection-settings-desktop.png` });
  await desktopSettings.getByRole('button', { name: 'Cancel', exact: true }).click();
  await desktop.getByRole('button', { name: 'Manage collection data' }).click();
  await desktop.getByLabel('Import collection JSON').setInputFiles({
    name: 'missing-image.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        title: 'Missing image example',
        description: 'A local collection with an unavailable cover.',
        example: false,
        categories: [{ id: 'notes', label: 'Notes', color: '#234e70' }],
        items: [
          {
            id: 'missing-image',
            title: 'Missing image',
            category: 'notes',
            description: 'This import should remain inactive.',
            details: 'The image preflight reports this local path before activation.',
            tags: ['Example'],
            added: '2026-10-09',
            image: { src: 'images/missing-import.png', alt: 'An unavailable example cover' },
          },
        ],
      }),
    ),
  });
  await desktop.getByRole('alert').waitFor();
  await desktop.screenshot({ path: `${output}collection-data-image-error-desktop.png` });
  await desktop.getByLabel('Import collection JSON').setInputFiles({
    name: 'cardthings-starter.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(createStarterCollection(new Date('2026-10-09T00:00:00Z')))),
  });
  await desktop.getByRole('status').filter({ hasText: 'Imported 1 items' }).waitFor();
  await desktop.getByRole('button', { name: 'Close collection data' }).click();
  await desktop.screenshot({ path: `${output}starter-collection-desktop.png` });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseUrl);
  await mobile.evaluate(() => localStorage.clear());
  await mobile.reload();
  await mobile.screenshot({ path: `${output}collection-mobile.png` });
  await mobile.getByRole('button', { name: 'Add card', exact: true }).click();
  const mobileEditor = mobile.getByRole('dialog', { name: 'Add a card' });
  await mobileEditor.getByLabel('Title').fill('Field Notes');
  await mobileEditor.getByLabel('Category').selectOption('tools');
  await mobileEditor
    .getByLabel('Short description')
    .fill('A practical reference added directly in the browser.');
  await mobileEditor.getByLabel('Title').focus();
  await mobile.screenshot({ path: `${output}card-editor-mobile.png` });
  await mobileEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await mobile.getByRole('button', { name: 'Manage collection data' }).click();
  await mobile.getByRole('button', { name: 'Collection settings' }).click();
  const mobileSettings = mobile.getByRole('dialog', { name: 'Collection settings' });
  await mobileSettings.getByLabel('Title').fill('Useful things, kept together.');
  await mobileSettings.getByLabel('Title').focus();
  await mobile.screenshot({ path: `${output}collection-settings-mobile.png` });
  await mobileSettings.getByRole('button', { name: 'Cancel', exact: true }).click();
  await mobile.getByRole('button', { name: /^Favorites 0$/ }).click();
  await mobile.screenshot({ path: `${output}favorites-empty-mobile.png` });
  await mobile.close();

  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fallback.route('**/images/collection-covers.webp', (route) => route.abort('failed'));
  await fallback.goto(baseUrl);
  await fallback.getByText('Image unavailable').first().waitFor();
  await fallback.screenshot({ path: `${output}image-fallback-mobile.png` });
  await fallback.close();

  const syncContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const syncTarget = await syncContext.newPage();
  await syncTarget.goto(baseUrl);
  await syncTarget.evaluate(() => localStorage.clear());
  await syncTarget.reload();
  const syncWriter = await syncContext.newPage();
  await syncWriter.goto(baseUrl);
  await syncWriter.getByRole('button', { name: 'Favorite Orbit Studio' }).click();
  await syncTarget.getByText('Favorites updated from another tab.').waitFor();
  await syncTarget.screenshot({ path: `${output}cross-tab-favorites-desktop.png` });
  await syncTarget.getByRole('button', { name: 'View Orbit Studio' }).click();
  await syncTarget
    .getByRole('dialog', { name: 'Orbit Studio' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  const staleEditor = syncTarget.getByRole('dialog', { name: 'Edit card' });
  await staleEditor.getByLabel('Title').fill('Draft title kept for review');
  await syncWriter.getByRole('button', { name: 'View Orbit Studio' }).click();
  await syncWriter
    .getByRole('dialog', { name: 'Orbit Studio' })
    .getByRole('button', { name: 'Edit card' })
    .click();
  const currentEditor = syncWriter.getByRole('dialog', { name: 'Edit card' });
  await currentEditor.getByLabel('Title').fill('Updated in another tab');
  await currentEditor.getByRole('button', { name: 'Save changes' }).click();
  await staleEditor.getByText('This collection changed in another tab.').waitFor();
  await syncTarget.screenshot({ path: `${output}card-editor-conflict-desktop.png` });
  await syncContext.close();
} finally {
  await browser.close();
}
