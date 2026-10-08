import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import brand from '../src/content/brand';
import type { Collection } from '../src/lib/types';

const collection: Collection = JSON.parse(
  readFileSync(new URL('../src/content/collection.json', import.meta.url), 'utf8'),
);

test('metadata and theme are present before client JavaScript runs', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL!.replace(/\/$/, '')}/`);
    await expect(page).toHaveTitle(brand.metadata.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      brand.metadata.description,
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      brand.theme.accent,
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', `./${brand.favicon}`);
    for (const [token, value] of Object.entries(brand.theme)) {
      expect(
        await page
          .locator('html')
          .evaluate(
            (element, key) => getComputedStyle(element).getPropertyValue(`--${key}`).trim(),
            token,
          ),
      ).toBe(value);
    }
  } finally {
    await context.close();
  }
});

test('all visible brand names and detail copy use the same configuration', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.brand > span')).toHaveText(brand.name);
  await expect(page.getByRole('button', { name: `${brand.name} home`, exact: true })).toBeVisible();
  await expect(page.locator('.sidebar-footer p')).toHaveText(brand.tagline);
  await expect(page.locator('.sidebar-footer a')).toHaveAttribute('href', brand.repositoryUrl);
  await expect(page.locator('.collection-footer span').first()).toHaveText(brand.footerNote);
  await expect(page.locator('.collection-footer span').last()).toHaveText(
    `Made with ${brand.name}`,
  );
  await page
    .getByRole('button', { name: `View ${collection.items[0].title}`, exact: true })
    .click();
  await expect(page.getByRole('dialog').locator('dd').last()).toHaveText(
    collection.example ? 'Example collection' : brand.name,
  );
  if (collection.example)
    await expect(page.locator('.example-note')).toContainText(`${brand.name} demo`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('configured colors reach real controls, headings, focus, and dialog states', async ({
  page,
  isMobile,
}) => {
  await page.goto('./');
  const color = async (token: keyof typeof brand.theme) =>
    page.evaluate((hex) => {
      const element = document.createElement('span');
      element.style.color = hex;
      document.body.append(element);
      const value = getComputedStyle(element).color;
      element.remove();
      return value;
    }, brand.theme[token]);
  await expect(page.locator('html')).toHaveCSS('background-color', await color('background'));
  await expect(page.locator('.intro h1')).toHaveCSS('color', await color('heading'));
  await expect(page.locator('.brand')).toHaveCSS('color', await color('brand-mark'));
  await expect(page.locator('.brand > span')).toHaveCSS('color', await color('brand-text'));
  await expect(page.locator('.filter-chips [aria-pressed="true"]')).toHaveCSS(
    'background-color',
    await color('accent'),
  );
  await page.getByRole('searchbox').focus();
  await expect(page.locator('.search-box')).toHaveCSS('border-color', await color('focus-border'));
  await page
    .getByRole('button', { name: `View ${collection.items[0].title}`, exact: true })
    .click();
  const action = page.getByRole('dialog').locator('.primary-button');
  await expect(action).toHaveCSS('background-color', await color('accent'));
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS('outline-color', await color('focus-ring'));
  if (!isMobile) {
    await action.hover();
    await expect(action).toHaveCSS('background-color', await color('accent-hover'));
  }
});
