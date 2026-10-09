import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a card' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillRequiredCard(dialog: ReturnType<Page['getByRole']>, title = 'Field Notes') {
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Category').selectOption('tools');
  await dialog.getByLabel('Short description').fill('A practical entry added in the browser.');
  await dialog
    .getByLabel('Details')
    .fill('Keep the longer context here so the card remains useful later.');
}

test('adds a generated-cover card, opens its details, and persists it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('./');
  const dialog = await openEditor(page);
  await expect(dialog.getByLabel('Title')).toBeFocused();
  await fillRequiredCard(dialog);
  await dialog.getByLabel('Tags (optional)').fill('Research, Reference');
  await dialog.getByLabel('Resource link (optional)').fill('https://example.com/field-notes');
  await dialog.getByRole('button', { name: 'Add card', exact: true }).click();

  const details = page.getByRole('dialog', { name: 'Field Notes' });
  await expect(details).toBeVisible();
  await expect(details.locator('.cover-generated')).toBeVisible();
  await expect(details.getByRole('link', { name: /Visit resource/ })).toHaveAttribute(
    'href',
    'https://example.com/field-notes',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByRole('button', { name: 'View Field Notes' })).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(13);
  await page.reload();
  await expect(page.getByRole('button', { name: 'View Field Notes' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cardthings:collection:v1') || '{}').items?.some(
        (item: { title?: string }) => item.title === 'Field Notes',
      ),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('reports invalid tags and image paths, preflights local images, and cancels cleanly', async ({
  page,
}) => {
  await page.goto('./');
  const dialog = await openEditor(page);
  await fillRequiredCard(dialog, 'Unfinished Card');
  await dialog.getByLabel('Tags (optional)').fill('Notes, notes');
  await dialog.getByLabel('Image path').fill('../private.png');
  await dialog.getByLabel('Image description').fill('A private file');
  await dialog.getByRole('button', { name: 'Add card', exact: true }).click();
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('Tags must be unique within this item');
  await expect(alert).toContainText('Image path must be a local path relative to public/');
  await expect(dialog.getByLabel('Tags (optional)')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByLabel('Tags (optional)')).toBeFocused();

  await dialog.getByLabel('Tags (optional)').fill('Notes');
  await dialog.getByLabel('Image path').fill('images/not-there.png');
  await dialog.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(alert).toContainText('Image path could not be loaded from this CardThings site');
  await expect(dialog.getByLabel('Image path')).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.collection-card')).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'View Unfinished Card' })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('cardthings:collection:v1'))).toBeNull();
});

test('cancels an edit, then saves a repeated edit without changing the stable card link', async ({
  page,
}) => {
  await page.goto('./?item=orbit-studio');
  let details = page.getByRole('dialog', { name: 'Orbit Studio' });
  await details.getByRole('button', { name: 'Save to favorites' }).click();
  await details.getByRole('button', { name: 'Edit card' }).click();
  let editor = page.getByRole('dialog', { name: 'Edit card' });
  await expect(editor.getByLabel('Title')).toBeFocused();
  await editor.getByLabel('Title').fill('Changed only in the draft');
  await page.keyboard.press('Escape');
  details = page.getByRole('dialog', { name: 'Orbit Studio' });
  await expect(details).toBeVisible();
  await expect(page).toHaveURL(/item=orbit-studio/);

  await details.getByRole('button', { name: 'Edit card' }).click();
  editor = page.getByRole('dialog', { name: 'Edit card' });
  await editor.getByLabel('Title').fill('Orbit Notes');
  await editor.getByLabel('Short description').fill('An edited browser-local description.');
  await editor.getByRole('button', { name: 'Save changes' }).click();
  details = page.getByRole('dialog', { name: 'Orbit Notes' });
  await expect(details).toBeVisible();
  await expect(details.getByRole('button', { name: 'Saved to favorites' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/item=orbit-studio/);
  await expect(details.locator('.cover')).toHaveCSS('background-size', '300% auto');
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByRole('button', { name: 'View Orbit Notes' })).toBeVisible();
});

test('keeps the editor inside a narrow viewport and traps keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('./');
  const dialog = await openEditor(page);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel card editing' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Add card', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel card editing' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add card', exact: true })).toBeFocused();
});

test('keeps a saved card available for the visit when storage is unavailable', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  const dialog = await openEditor(page);
  await fillRequiredCard(dialog, 'Temporary Card');
  await dialog.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Temporary Card' })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByText('Collection changes are available for this visit')).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Temporary Card' })).toBeVisible();
});
