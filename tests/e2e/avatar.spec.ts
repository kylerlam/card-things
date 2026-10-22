import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("avatar selection and drag upload share a crop editor and persist the saved image", async ({ page }) => {
  const orange = await sharp({ create: { width: 120, height: 120, channels: 3, background: "#f97316" } }).png().toBuffer();
  const picture = await sharp({ create: { width: 240, height: 120, channels: 3, background: "#4f46e5" } }).composite([{ input: orange, left: 120, top: 0 }]).png().toBuffer();
  await page.goto("/auth");
  await page.getByLabel("電子郵件或 Demo 帳號").fill("cardthings");
  await page.getByLabel("密碼", { exact: true }).fill("password");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/user$/);
  await page.getByRole("button", { name: "個人資料管理", exact: true }).click();
  const editor = page.getByRole("region", { name: "頭像管理" });
  const crop = page.getByRole("dialog", { name: "裁切頭像" });
  await editor.getByLabel("選擇頭像圖片").setInputFiles({ name: "first.png", mimeType: "image/png", buffer: picture });
  await expect(crop).toBeVisible();
  await crop.getByRole("slider", { name: "頭像縮放", exact: true }).press("End");
  await crop.getByRole("slider", { name: "頭像水平位置", exact: true }).press("Home");
  await crop.getByRole("button", { name: "取消", exact: true }).click();
  await expect(crop).not.toBeVisible();
  await expect(editor.getByRole("status")).toHaveCount(0);

  const data = await page.evaluateHandle((base64) => {
    const transfer = new DataTransfer();
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    transfer.items.add(new File([bytes], "dropped.png", { type: "image/png" }));
    return transfer;
  }, picture.toString("base64"));
  await editor.getByRole("button", { name: "上傳頭像圖片" }).dispatchEvent("drop", { dataTransfer: data });
  await expect(crop).toBeVisible();
  await crop.getByRole("slider", { name: "頭像縮放", exact: true }).press("End");
  await crop.getByRole("slider", { name: "頭像水平位置", exact: true }).press("End");
  await crop.getByRole("slider", { name: "頭像垂直位置", exact: true }).press("End");
  await crop.getByRole("button", { name: "儲存頭像", exact: true }).click();
  await expect(crop).not.toBeVisible();
  await expect(editor.getByRole("status")).toHaveText("頭像已更新。");
  const avatar = editor.getByRole("img", { name: "cardthings 的頭像", exact: true });
  await expect(avatar).toBeVisible();
  const saved = await avatar.getAttribute("src");
  expect(saved).toMatch(/^\/api\/avatars\/ct[a-z0-9]{12}-[a-f0-9-]+\.png$/);
  const response = await page.request.get(saved!);
  expect(response.status()).toBe(200);
  const cropped = await sharp(await response.body()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(cropped.info).toMatchObject({ width: 512, height: 512, channels: 3 });
  expect([...cropped.data.subarray(0, 3)]).toEqual([249, 115, 22]);
  await page.reload();
  await expect(page.getByRole("region", { name: "頭像管理" }).getByRole("img", { name: "cardthings 的頭像", exact: true })).toHaveAttribute("src", saved!);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
});
