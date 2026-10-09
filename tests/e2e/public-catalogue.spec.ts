import { expect, test } from "@playwright/test";

test("public catalogue filters and opens a dedicated detail route", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CardThings/);
  await expect(page.getByRole("heading", { name: "先按用途逛，再看工具" })).toBeVisible();
  await expect(page.getByText("LabNote")).toHaveCount(0);

  await page.getByRole("searchbox", { name: "搜尋工具或用途" }).fill("傳送");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: /查看用途與取得方式/ }).click();
  await expect(page).toHaveURL(/\/tools\/relaydrop$/);
  await expect(page.getByRole("heading", { name: "安裝與下載" })).toBeVisible();
  await expect(page.getByRole("link", { name: "前往來源" })).toBeVisible();
});
