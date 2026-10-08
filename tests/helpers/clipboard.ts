import { expect, type BrowserContext, type Page } from '@playwright/test';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

export async function prepareClipboard(
  context: BrowserContext,
  page: Page,
  browserName: BrowserName,
) {
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    return;
  }
  // Playwright does not expose the same clipboard grants on every engine.
  // Capture the application's exact write payload; native behavior is tested separately.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedTestLink: string }).copiedTestLink = text;
        },
      },
    });
  });
}

export async function readCopiedLink(page: Page, browserName: BrowserName) {
  await expect(
    page.getByRole('status').filter({ hasText: 'Link copied to clipboard.' }),
  ).toHaveCount(1);
  return browserName === 'chromium'
    ? page.evaluate(() => navigator.clipboard.readText())
    : page.evaluate(() => (window as unknown as { copiedTestLink: string }).copiedTestLink);
}
