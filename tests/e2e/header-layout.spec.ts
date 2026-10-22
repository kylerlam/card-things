import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("site header centers Home and keeps the enlarged account avatar at the right edge", async ({ page, baseURL }) => {
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  const home = navigation.getByRole("link", { name: "首頁", exact: true });

  async function expectCenteredHome() {
    const header = await navigation.boundingBox();
    const link = await home.boundingBox();
    expect(Math.abs(header!.x + header!.width / 2 - link!.x - link!.width / 2)).toBeLessThan(1);
    expect(Math.abs(header!.y + header!.height / 2 - link!.y - link!.height / 2)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
    const brand = await navigation.getByRole("link", { name: /CardThings/ }).boundingBox();
    expect(brand!.x + brand!.width).toBeLessThanOrEqual(link!.x);
  }

  for (const width of [311, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(navigation.getByRole("link", { name: "登入", exact: true })).toBeVisible();
    await expectCenteredHome();
  }
  await page.goto("/auth");
  await expect(navigation.getByRole("link", { name: "登入", exact: true })).toHaveCount(0);
  await expectCenteredHome();
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
    await expectCenteredHome();
    const header = await navigation.boundingBox();
    const avatar = await account.boundingBox();
    expect(avatar!.width).toBeCloseTo(36 * 1.3, 1);
    expect(avatar!.height).toBeCloseTo(36 * 1.3, 1);
    expect(Math.abs(header!.x + header!.width - avatar!.x - avatar!.width)).toBeLessThan(1);
    expect(Math.abs(header!.y + header!.height / 2 - avatar!.y - avatar!.height / 2)).toBeLessThan(1);
  }
});
