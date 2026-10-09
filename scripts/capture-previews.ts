import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

  await desktop.getByRole('button', { name: 'View Orbit Studio' }).click();
  await desktop.screenshot({ path: `${output}item-detail-desktop.png` });
  await desktop.getByRole('button', { name: 'Close details' }).click();

  await desktop.getByRole('button', { name: 'Manage collection data' }).click();
  await desktop.screenshot({ path: `${output}collection-data-desktop.png` });
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
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseUrl);
  await mobile.evaluate(() => localStorage.clear());
  await mobile.reload();
  await mobile.screenshot({ path: `${output}collection-mobile.png` });
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
  await syncContext.close();
} finally {
  await browser.close();
}
