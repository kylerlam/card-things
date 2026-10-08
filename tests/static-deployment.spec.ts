import { test, expect } from '@playwright/test';

test('built assets load from the mount without root-level assets or SPA fallback', async ({
  page,
  request,
  baseURL,
}) => {
  const resources: { url: string; status: number }[] = [];
  page.on('response', (response) => {
    if (['script', 'stylesheet', 'image'].includes(response.request().resourceType())) {
      resources.push({ url: response.url(), status: response.status() });
    }
  });
  await page.goto('./');
  await expect(page.locator('.collection-card')).toHaveCount(12);
  const loaded = await page
    .locator('.cover')
    .first()
    .evaluate(
      (element) =>
        new Promise<boolean>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image.naturalWidth > 0);
          image.onerror = () => resolve(false);
          image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
        }),
    );
  expect(loaded).toBe(true);
  expect(resources.length).toBeGreaterThanOrEqual(3);
  for (const resource of resources) {
    expect(resource.url.startsWith(baseURL!)).toBe(true);
    expect(resource.status).toBe(200);
  }
  const favicon = await request.get('favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/svg+xml');
  expect((await request.get('/images/collection-covers.png')).status()).toBe(404);
  expect((await request.get('not-an-app-route')).status()).toBe(404);
});

test('a shared detail refreshes and closes while preserving subpath, filters, and anchor', async ({
  page,
}) => {
  await page.goto('./?q=Orbit&category=tools&item=orbit-studio#collection');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Orbit Studio', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const restored = new URL(page.url());
  expect(restored.pathname).toBe('/collections/card-things/');
  expect(restored.hash).toBe('#collection');
  expect(restored.searchParams.get('q')).toBe('Orbit');
  expect(restored.searchParams.get('category')).toBe('tools');
  expect(restored.searchParams.has('item')).toBe(false);
  await expect(page.locator('.collection-card')).toHaveCount(1);
});

test('the static host redirects a bare directory without losing query parameters', async ({
  page,
  request,
}) => {
  const response = await request.get('/collections/card-things?q=Orbit&category=tools', {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/collections/card-things/?q=Orbit&category=tools');
  await page.goto('/collections/card-things?q=Orbit&category=tools');
  await expect(page).toHaveURL(/\/collections\/card-things\/\?q=Orbit&category=tools$/);
  await expect(page.locator('.collection-card')).toHaveCount(1);
});

test('an explicit index file supports assets, detail refresh, and history', async ({ page }) => {
  await page.goto('index.html?category=tools');
  await expect(page.locator('.collection-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'View Orbit Studio', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/collections/card-things/index.html');
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/collections\/card-things\/index\.html\?category=tools$/);
});
