import { expect, test } from "@playwright/test";

for (const entry of ["/", "/?category=transfer#catalogue"]) {
  test(`catalogue ${entry} browser and in-page back restore filters and the previous viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 420 });
    await page.goto(entry);
    await page.getByRole("complementary", { name: "標籤篩選" }).getByRole("button", { name: "開源", exact: true }).click();
    await page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" }).fill("Relay");
    const catalogueUrl = page.url();
    const detail = page.getByRole("link", { name: /查看用途與取得方式/ });
    await expect(detail).toHaveCount(1);
    await detail.scrollIntoViewIfNeeded();
    const previous = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
    expect(previous.y).toBeGreaterThan(100);
    await detail.click();
    await expect(page).toHaveURL(/\/tools\/relaydrop$/);
    await page.goBack();
    await expect(page).toHaveURL(catalogueUrl);
    await expect(page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" })).toHaveValue("Relay");
    await expect(page.getByRole("complementary", { name: "標籤篩選" }).getByRole("button", { name: "開源", exact: true })).toHaveAttribute("aria-pressed", "true");
    if (entry.includes("category=")) await expect(page.getByRole("button", { name: "清除分類：檔案與同步", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(previous.y, 0);
    await page.goForward();
    await expect(page).toHaveURL(/\/tools\/relaydrop$/);
    await page.reload();
    await page.getByRole("link", { name: "返回卡片列表", exact: true }).click();
    await expect(page).toHaveURL(catalogueUrl);
    await expect(page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" })).toHaveValue("Relay");
    await expect(page.getByRole("complementary", { name: "標籤篩選" }).getByRole("button", { name: "開源", exact: true })).toHaveAttribute("aria-pressed", "true");
    if (entry.includes("category=")) await expect(page.getByRole("button", { name: "清除分類：檔案與同步", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(previous.y, 0);
  });
}

test("direct detail visits return to a fresh catalogue", async ({ page }) => {
  await page.goto("/tools/framesnap");
  await page.getByRole("link", { name: "返回卡片列表", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" })).toHaveValue("");
  await expect(page.getByRole("button", { name: "全部標籤", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("opening a card in another tab keeps normal links and returns to a fresh catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "開源", exact: true }).click();
  await page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" }).fill("Relay");
  const popup = page.context().waitForEvent("page");
  await page.getByRole("link", { name: /查看用途與取得方式/ }).click({ modifiers: ["ControlOrMeta"] });
  const detail = await popup;
  try {
    await expect(detail).toHaveURL(/\/tools\/relaydrop$/);
    await detail.getByRole("link", { name: "返回卡片列表", exact: true }).click();
    await expect(detail).toHaveURL(/\/$/);
    await expect(detail.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" })).toHaveValue("");
    await expect(detail.getByRole("button", { name: "全部標籤", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("searchbox", { name: "搜尋標籤、分類或工具名稱" })).toHaveValue("Relay");
    await expect(page.getByRole("button", { name: "清除標籤：開源", exact: true })).toBeVisible();
  } finally {
    await detail.close();
  }
});
