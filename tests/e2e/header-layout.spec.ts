import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("site header centers the navigation group and keeps the enlarged account avatar at the right edge", async ({ page, baseURL }) => {
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  const home = navigation.getByRole("link", { name: "首頁", exact: true });
  const menu = navigation.getByRole("group", { name: "網站選單" });

  async function expectNavigationLayout() {
    const header = await navigation.boundingBox();
    const links = await menu.boundingBox();
    const brand = await navigation.getByRole("link", { name: /CardThings/ }).boundingBox();
    expect(Math.abs(header!.x + header!.width / 2 - links!.x - links!.width / 2)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
    await expect(home).toBeVisible();
    await expect(menu.getByRole("link", { name: "工具庫", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "分類導覽", exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "關於本站", exact: true })).toBeVisible();
    if (page.viewportSize()!.width >= 768) {
      expect(Math.abs(header!.y + header!.height / 2 - links!.y - links!.height / 2)).toBeLessThan(1);
      expect(brand!.x + brand!.width).toBeLessThanOrEqual(links!.x);
    } else {
      expect(links!.y).toBeGreaterThanOrEqual(brand!.y + brand!.height);
      expect(links!.x).toBeGreaterThanOrEqual(header!.x);
      expect(links!.x + links!.width).toBeLessThanOrEqual(header!.x + header!.width);
    }
  }

  for (const width of [311, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page).toHaveTitle("CardThings · 卡片內容分享 · 導航探索");
    await expect(navigation.getByText("卡片內容分享 · 導航探索")).toHaveCount(0);
    expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontSize)).toBe("17px");
    expect(await home.evaluate((element) => getComputedStyle(element).fontSize)).toBe(width <= 360 ? "12.75px" : "14.875px");
    await expect(navigation.getByRole("link", { name: "登入", exact: true })).toBeVisible();
    await expectNavigationLayout();
  }
  await page.goto("/auth");
  await expect(navigation.getByRole("link", { name: "登入", exact: true })).toHaveCount(0);
  await expectNavigationLayout();
  await page.getByLabel("電子郵件或 Demo 帳號").fill("cardthings");
  await page.getByLabel("密碼", { exact: true }).fill("password");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/user$/);

  const image = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#4f46e5" } }).png().toBuffer();
  const upload = await page.request.post("/api/account/avatar", {
    headers: { Origin: baseURL! },
    multipart: { avatar: { name: "header-avatar.png", mimeType: "image/png", buffer: image } },
  });
  expect(upload.status()).toBe(200);

  for (const width of [311, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const account = navigation.getByRole("link", { name: "我的帳戶：cardthings", exact: true });
    await expect(account).toBeVisible();
    await expect(account.getByRole("img", { name: "cardthings 的頭像", exact: true })).toBeVisible();
    await expectNavigationLayout();
    const header = await navigation.boundingBox();
    const avatar = await account.boundingBox();
    expect(avatar!.width).toBeCloseTo(36 * 1.3, 1);
    expect(avatar!.height).toBeCloseTo(36 * 1.3, 1);
    expect(Math.abs(header!.x + header!.width - avatar!.x - avatar!.width)).toBeLessThan(1);
    const brand = await navigation.getByRole("link", { name: /CardThings/ }).boundingBox();
    expect(Math.abs(brand!.y + brand!.height / 2 - avatar!.y - avatar!.height / 2)).toBeLessThan(1);
  }
});


test("category navigation is keyboard accessible and stays inside narrow viewports", async ({ page }) => {
  for (const width of [311, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "分類導覽", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu", { name: "用途分類" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "全部卡片", exact: true })).toBeFocused();
    const bounds = await menu.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(menu).toBeVisible();
    // The popup can cover the hero on a narrow screen; click the page gutter.
    await page.mouse.click(4, 4);
    await expect(menu).toBeHidden();
  }
});
