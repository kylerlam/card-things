import { expect, test } from "@playwright/test";

test("a guest can sign in from a favourite and return to the catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "收藏 FrameSnap" }).click();
  await expect(page).toHaveURL(/\/auth\?.*favorite=framesnap/);
  await expect(page.getByText(/完成表單後會收藏「FrameSnap」/)).toBeVisible();

  await page.getByLabel("電子郵件").fill("visitor@example.test");
  await page.getByLabel("密碼", { exact: true }).fill("demo-pass-2026");
  await page.getByRole("button", { name: "登入體驗" }).click();

  await expect(page).toHaveURL(/\/#catalogue$/);
  await expect(page.getByRole("button", { name: "取消收藏 FrameSnap" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("link", { name: "我的空間" }).click();
  await page.getByRole("button", { name: "我的收藏" }).click();
  await expect(page.getByRole("link", { name: "FrameSnap" })).toBeVisible();
  await expect(page).toHaveURL(/\/user\?view=favorites$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: /歡迎回來/ })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible();
});

test("registration, private tools, profile updates, and logout stay in demo mode", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Full form flow is covered once on desktop.");

  await page.goto("/auth?register=1&next=/user");
  await page.getByLabel("用戶名").fill("線框體驗者");
  await page.getByLabel("電子郵件").fill("wireframe@example.test");
  await page.getByRole("button", { name: "取得示意驗證碼" }).click();
  await expect(page.getByRole("status")).toContainText("沒有發送任何郵件");
  await page.getByLabel("郵箱驗證碼").fill("246810");
  await page.getByLabel("密碼", { exact: true }).fill("demo-pass-2026");
  await page.getByLabel("再次輸入密碼").fill("different-password");
  await page.getByLabel("我不是機器人").check();
  await page.getByRole("button", { name: "註冊並進入體驗" }).click();
  await expect(page.getByRole("status")).toContainText("兩次輸入的密碼不一致");
  await page.getByLabel("再次輸入密碼").fill("demo-pass-2026");
  await page.getByRole("button", { name: "註冊並進入體驗" }).click();

  await expect(page).toHaveURL(/\/user$/);
  await expect(page.getByRole("heading", { name: "歡迎回來，線框體驗者" })).toBeVisible();
  await page.getByRole("button", { name: "我的收藏", exact: true }).click();
  await expect(page.getByText(/尚未收藏/)).toBeVisible();
  await page.getByRole("button", { name: "自訂添加", exact: true }).click();
  await page.getByRole("button", { name: "添加工具" }).click();
  await page.getByLabel("工具名稱").fill("我的离线工具");
  await page.getByLabel("用途備註（選填）").fill("只在本次体验中可见");
  await page.getByRole("button", { name: "存入此原型" }).click();
  await expect(page.getByText("我的离线工具", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "個人資料管理" }).click();
  await page.getByLabel("用戶名").fill("已更新用戶");
  await page.getByRole("button", { name: "儲存資料 · 示意" }).click();
  await expect(page.getByRole("status")).toContainText("個人資料已更新");

  await page.getByRole("button", { name: "退出體驗模式" }).click();
  await expect(page).toHaveURL(/\/auth\?logout=1$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "請先進入體驗模式" })).toBeVisible();
});
