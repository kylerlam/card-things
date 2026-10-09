import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Manage collection data' }).click();
  await page.getByRole('button', { name: 'Collection settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Collection settings' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('saves collection copy and category appearance without changing stable references', async ({
  page,
}) => {
  await page.goto('./?category=tools');
  await page.getByRole('button', { name: 'Favorite Orbit Studio', exact: true }).click();
  const dialog = await openSettings(page);
  await expect(dialog.getByLabel('Title')).toBeFocused();
  await dialog.getByLabel('Title').fill('Useful Things');
  await dialog
    .getByLabel('Description')
    .fill('A practical collection shaped in the browser workspace.');
  const tools = dialog.getByRole('group', { name: 'Category 1' });
  await tools.getByLabel('Name').fill('Utilities');
  await tools.getByLabel('Color', { exact: true }).fill('#123456');
  await dialog.getByRole('button', { name: 'Save settings' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Useful Things');
  await expect(
    page.getByText('A practical collection shaped in the browser workspace.'),
  ).toBeVisible();
  await expect(page).toHaveURL(/\?category=tools$/);
  await expect(
    page
      .getByRole('group', { name: 'Filter by category' })
      .getByRole('button', { name: 'Utilities', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Unfavorite Orbit Studio', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.collection-card').first().locator('.category-dot')).toHaveCSS(
    'background-color',
    'rgb(18, 52, 86)',
  );
  await page.getByRole('searchbox', { name: 'Search collection' }).fill('Utilities');
  await expect(page.locator('.collection-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'View Orbit Studio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cardthings:collection:v1') || '{}'),
  );
  expect(saved.categories[0]).toEqual({ id: 'tools', label: 'Utilities', color: '#123456' });
  expect(saved.items.find((item: { id: string }) => item.id === 'orbit-studio').category).toBe(
    'tools',
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Useful Things');
  await page.getByRole('button', { name: 'Manage collection data' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('useful-things.json');
  expect(JSON.parse(readFileSync((await download.path())!, 'utf8'))).toEqual(saved);
});

test('adds a uniquely identified category and keeps its ID stable after a draft rename', async ({
  page,
}) => {
  await page.goto('./');
  const dialog = await openSettings(page);
  await dialog.getByLabel('Name', { exact: true }).last().fill('Tools');
  await dialog.getByLabel('Color', { exact: true }).last().fill('#765432');
  await dialog.getByRole('button', { name: 'Add category' }).click();
  const added = dialog.getByRole('group', { name: 'Category 5' });
  await expect(added).toContainText('Stable ID: tools-2');
  await added.getByLabel('Name').fill('Field Notes');
  await dialog.getByRole('button', { name: 'Save settings' }).click();

  await expect(
    page
      .getByRole('group', { name: 'Filter by category' })
      .getByRole('button', { name: 'Field Notes', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add a card' }).getByLabel('Category')).toHaveValue(
    'tools',
  );
  await expect(
    page.getByRole('dialog', { name: 'Add a card' }).getByRole('option', { name: 'Field Notes' }),
  ).toHaveAttribute('value', 'tools-2');
  await page
    .getByRole('dialog', { name: 'Add a card' })
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await page.reload();
  const reopened = await openSettings(page);
  await expect(reopened.getByRole('group', { name: 'Category 5' })).toContainText(
    'Stable ID: tools-2',
  );
});

test('validates settings and discards cancelled or repeated drafts', async ({ page }) => {
  await page.goto('./');
  let dialog = await openSettings(page);
  await dialog.getByLabel('Title').fill('   ');
  const firstCategory = dialog.getByRole('group', { name: 'Category 1' });
  await firstCategory.getByLabel('Name').fill('');
  await firstCategory.getByLabel('Color', { exact: true }).fill('not-a-color');
  await dialog.getByRole('button', { name: 'Save settings' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Please fix the highlighted fields.');
  await expect(dialog.getByLabel('Title')).toHaveAttribute('aria-invalid', 'true');
  await expect(firstCategory.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
  await expect(firstCategory.getByLabel('Color', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(dialog.getByLabel('Title')).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good things, kept together.');
  expect(await page.evaluate(() => localStorage.getItem('cardthings:collection:v1'))).toBeNull();
  dialog = await openSettings(page);
  await expect(dialog.getByLabel('Title')).toHaveValue('Good things, kept together.');
  await expect(dialog.getByRole('group', { name: 'Category 1' }).getByLabel('Name')).toHaveValue(
    'Tools',
  );
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manage collection data' })).toBeFocused();
});

test('keeps settings accessible and usable in a narrow viewport and without storage', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('./');
  const dialog = await openSettings(page);
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
  await expect(dialog.getByRole('button', { name: 'Cancel collection settings' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Save settings' })).toBeFocused();
  await dialog.getByLabel('Title').fill('Temporary Shelf');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await dialog.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Temporary Shelf');
  await expect(page.getByText('Collection changes are available for this visit')).toBeVisible();
  await expect(page.getByText('Collection settings are available for this visit')).toBeVisible();
});

test('synchronizes settings across tabs while preserving valid URLs and favorites', async ({
  page,
}) => {
  await page.goto('./?category=tools&item=orbit-studio');
  await page.getByRole('button', { name: 'Save to favorites' }).click();
  const peer = await page.context().newPage();
  await peer.goto('./');
  const dialog = await openSettings(peer);
  await dialog.getByLabel('Title').fill('Shared Toolkit');
  await dialog.getByRole('group', { name: 'Category 1' }).getByLabel('Name').fill('Utilities');
  await dialog.getByRole('button', { name: 'Save settings' }).click();

  await expect(page.getByText('Collection updated from another tab.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Orbit Studio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saved to favorites' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page).toHaveURL(/\?category=tools&item=orbit-studio$/);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shared Toolkit');
  await expect(
    page
      .getByRole('group', { name: 'Filter by category' })
      .getByRole('button', { name: 'Utilities', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('blocks a stale settings draft after another tab changes the collection', async ({ page }) => {
  await page.goto('./');
  const peer = await page.context().newPage();
  await peer.goto('./');
  const staleDialog = await openSettings(page);
  await staleDialog.getByLabel('Title').fill('Older Draft');

  const currentDialog = await openSettings(peer);
  await currentDialog.getByLabel('Name', { exact: true }).last().fill('Shared Category');
  await currentDialog.getByRole('button', { name: 'Add category' }).click();
  await currentDialog.getByRole('button', { name: 'Save settings' }).click();

  await expect(staleDialog.getByRole('alert')).toContainText(
    'This collection changed in another tab.',
  );
  await expect(staleDialog.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  await staleDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  const reopened = await openSettings(page);
  await expect(reopened.getByRole('group', { name: 'Category 5' }).getByLabel('Name')).toHaveValue(
    'Shared Category',
  );
  await expect(reopened.getByLabel('Title')).toHaveValue('Good things, kept together.');
});
