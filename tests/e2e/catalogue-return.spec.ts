import { expect, test } from "@playwright/test";

test("catalogue browser and in-page back restore filters and the previous viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 532 });
  await page.goto("/");
  await page.getByRole("button", { name: "檔案與同步", exact: true }).click();
  await page.getByRole("searchbox", { name: "搜尋卡片或分類" }).fill("Relay");
  const detail = page.getByRole("link", { name: /查看用途與取得方式/ });
  await expect(detail).toHaveCount(1);
  await detail.scrollIntoViewIfNeeded();
  const previous = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  expect(previous.y).toBeGreaterThan(200);
  await detail.click();
  await expect(page).toHaveURL(/\/tools\/relaydrop$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("searchbox", { name: "搜尋卡片或分類" })).toHaveValue("Relay");
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(previous.y, 0);
  await page.goForward();
  await expect(page).toHaveURL(/\/tools\/relaydrop$/);
  await page.reload();
  await page.getByRole("link", { name: "返回卡片列表", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("searchbox", { name: "搜尋卡片或分類" })).toHaveValue("Relay");
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(previous.y, 0);
});

test("direct detail visits return to a fresh catalogue", async ({ page }) => {
  await page.goto("/tools/framesnap");
  await page.getByRole("link", { name: "返回卡片列表", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("searchbox", { name: "搜尋卡片或分類" })).toHaveValue("");
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("opening a card in another tab keeps normal links and returns to a fresh catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "搜尋卡片或分類" }).fill("Relay");
  const popup = page.context().waitForEvent("page");
  await page.getByRole("link", { name: /查看用途與取得方式/ }).click({ modifiers: ["ControlOrMeta"] });
  const detail = await popup;
  try {
    await expect(detail).toHaveURL(/\/tools\/relaydrop$/);
    await detail.getByRole("link", { name: "返回卡片列表", exact: true }).click();
    await expect(detail).toHaveURL(/\/$/);
    await expect(detail.getByRole("searchbox", { name: "搜尋卡片或分類" })).toHaveValue("");
    await expect(page.getByRole("searchbox", { name: "搜尋卡片或分類" })).toHaveValue("Relay");
  } finally {
    await detail.close();
  }
});
