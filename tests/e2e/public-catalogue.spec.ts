import { expect, test } from "@playwright/test";

test("public catalogue filters and opens a dedicated detail route", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CardThings/);
  await expect(page.getByRole("heading", { name: "卡片列表", level: 1 })).toBeVisible();
  await expect(page.getByText("發現實用好工具", { exact: true })).toHaveCount(0);
  await expect(page.getByText("LabNote")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Demo/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /收藏/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "卡片分類" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "管理入口" })).toHaveCount(0);

  await page.getByRole("searchbox", { name: "搜尋標籤、分類或卡片名稱" }).fill("傳送");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: /查看卡片詳情/ }).click();
  await expect(page).toHaveURL(/\/tools\/relaydrop$/);
  await expect(page.getByRole("heading", { name: "這張卡片介紹什麼" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "相關連結" })).toBeVisible();
  await expect(page.getByRole("link", { name: "前往來源" })).toBeVisible();
});
