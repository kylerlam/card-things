import { expect, test } from "@playwright/test";

test("admin authorization and catalogue CRUD use the real database", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Covered once on desktop.");

  await page.goto("/admin/tools");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("電子郵件").fill("admin@example.test");
  await page.getByLabel("密碼").fill("E2e-Only-Password-2026!");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/categories");
  await page.getByLabel("分類名稱").fill("E2E 分類");
  await page.getByLabel("Slug").fill("e2e-category");
  await page.getByLabel("排序").fill("90");
  await page.getByLabel("說明").fill("只存在隔離端對端資料庫的分類。");
  await page.getByRole("button", { name: "新增分類" }).click();
  await expect(page.getByText("E2E 分類", { exact: true })).toBeVisible();

  await page.goto("/admin/tags");
  await page.getByLabel("Tag 名稱").fill("E2E 標籤");
  await page.getByLabel("Slug").fill("e2e-tag");
  await page.getByRole("button", { name: "新增 Tag" }).click();
  await expect(page.getByText("E2E 標籤", { exact: true })).toBeVisible();

  await page.goto("/admin/tools/new");
  await page.getByLabel("工具名稱").fill("E2E Tool");
  await page.getByLabel("Slug").fill("e2e-tool");
  await page.getByLabel("卡片摘要").fill("可搜尋的端對端正式工具資料。");
  await page.getByLabel("完整介紹").fill("這筆工具由管理員表單寫入真實隔離資料庫，並透過公開詳情頁讀取。");
  await page.getByLabel("用途分類").selectOption({ label: "E2E 分類" });
  await page.getByLabel("發布狀態").selectOption("published");
  await page.getByLabel("平台").fill("Web, Linux");
  await page.getByLabel("E2E 標籤").check();
  await page.getByPlaceholder("來源名稱").first().fill("正式下載");
  await page.getByPlaceholder("提供者").first().fill("Example Provider");
  await page.getByPlaceholder("平台").first().fill("Web");
  await page.getByPlaceholder("https://…").first().fill("https://example.com/e2e-tool");
  await page.getByRole("button", { name: "建立工具" }).click();
  await expect(page).toHaveURL(/\/admin\/tools$/);
  await expect(page.getByText("E2E Tool", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.getByRole("searchbox", { name: "搜尋工具或用途" }).fill("端對端");
  await expect(page.getByText("E2E Tool", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /查看用途與取得方式/ }).click();
  await expect(page).toHaveURL(/\/tools\/e2e-tool$/);
  await expect(page.getByRole("link", { name: "前往來源" })).toHaveAttribute(
    "href",
    "https://example.com/e2e-tool",
  );

  await page.goto("/admin/tools");
  await page.getByRole("link", { name: "編輯" }).last().click();
  await page.getByLabel("工具名稱").fill("E2E Tool Updated");
  await page.getByRole("button", { name: "儲存工具" }).click();
  await expect(page.getByText("E2E Tool Updated", { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".soft-surface")
    .filter({ hasText: "E2E Tool Updated" })
    .getByRole("button", { name: "刪除" })
    .click();
  await expect(page.getByText("E2E Tool Updated", { exact: true })).toHaveCount(0);

  await page.goto("/admin/tags");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".soft-surface")
    .filter({ hasText: "E2E 標籤" })
    .getByRole("button", { name: "刪除" })
    .click();
  await expect(page.getByText("E2E 標籤", { exact: true })).toHaveCount(0);

  await page.goto("/admin/categories");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".soft-surface")
    .filter({ hasText: "E2E 分類" })
    .getByRole("button", { name: "刪除" })
    .click();
  await expect(page.getByText("E2E 分類", { exact: true })).toHaveCount(0);
});
