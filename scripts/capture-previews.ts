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
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseUrl);
  await mobile.evaluate(() => localStorage.clear());
  await mobile.reload();
  await mobile.screenshot({ path: `${output}collection-mobile.png` });
  await mobile.getByRole('button', { name: /^Favorites 0$/ }).click();
  await mobile.screenshot({ path: `${output}favorites-empty-mobile.png` });
  await mobile.close();
} finally {
  await browser.close();
}
