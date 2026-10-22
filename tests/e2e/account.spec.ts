import { expect, test } from "@playwright/test";

test("registration, profile updates, login, and logout use server accounts", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Covered once on desktop.");

  await page.goto("/user");
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByRole("tab", { name: "註冊" }).click();
  await page.getByLabel("用戶名").fill("正式用戶");
  await page.getByLabel("電子郵件").fill("account@example.test");
  await page.getByLabel("密碼", { exact: true }).fill("Account-Password-2026!");
  await page.getByLabel("再次輸入密碼").fill("Account-Password-2026!");
  await page.getByRole("button", { name: "建立帳戶" }).click();

  await expect(page).toHaveURL(/\/user$/);
  await expect(page.getByRole("heading", { name: "歡迎回來，正式用戶" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "我的帳戶：正式用戶" })).toBeVisible();
  await page.goto("/user");
  await page.getByRole("button", { name: "個人資料管理" }).first().click();
  await expect(page.getByText(/^ct[a-z0-9]{12}$/)).toBeVisible();
  await page.getByLabel("用戶名").fill("cardthings_admin");
  await page.getByRole("button", { name: "儲存用戶名" }).click();
  await expect(page.getByRole("status")).toHaveText("這個用戶名已被使用，請換一個。");
  await page.getByLabel("用戶名").fill("正式用戶");
  await page.getByRole("button", { name: "儲存用戶名" }).click();
  await expect(page.getByRole("status")).toHaveText("用戶名已更新。");
  await page.getByLabel("用戶名").fill("已更新用戶");
  await page.getByRole("button", { name: "儲存用戶名" }).click();
  await expect(page.getByRole("status")).toHaveText("用戶名已更新。");

  await page.getByRole("button", { name: "登出" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/user");
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByLabel("電子郵件或 Demo 帳號").fill("account@example.test");
  await page.getByLabel("密碼", { exact: true }).fill("Account-Password-2026!");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page.getByRole("heading", { name: "歡迎回來，已更新用戶" })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/user$/);
});
