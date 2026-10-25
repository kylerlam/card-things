import { expect, test } from "@playwright/test";

test("admin authorization and catalogue CRUD use the real database", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Covered once on desktop.");

  await page.goto("/admin/tools");
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByLabel("電子郵件或 Demo 帳號").fill("admin@example.test");
  await page.getByLabel("密碼").fill("E2e-Only-Password-2026!");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("link", { name: "分類管理" })).toBeVisible();

  await page.goto("/admin/categories");
  await expect(page.getByRole("heading", { name: "用途分類", exact: true })).toBeVisible();
  await page.getByLabel("分類名稱").fill("E2E 分類");
  await page.getByLabel("網址代稱").fill("e2e-category");
  await page.getByLabel("排序").fill("90");
  await page.getByLabel("說明").fill("只存在隔離端對端資料庫的分類。");
  await page.getByRole("button", { name: "新增分類" }).click();
  await expect(page.getByText("E2E 分類", { exact: true })).toBeVisible();

  await page.goto("/admin/tags");
  await page.getByLabel("Tag 名稱").fill("E2E 標籤");
  await page.getByLabel("網址代稱").fill("e2e-tag");
  await page.getByRole("button", { name: "新增 Tag" }).click();
  await expect(page.getByText("E2E 標籤", { exact: true })).toBeVisible();

  await page.goto("/admin/tools/new");
  await expect(page.getByLabel("平台", { exact: true })).toHaveCount(0);
  await expect(page.getByText("至少 10 個字元，最多 220 個字元。")).toBeVisible();
  await expect(page.getByText("至少 20 個字元，最多 4000 個字元。")).toBeVisible();
  await page.getByRole("button", { name: "新增分類" }).click();
  await page.getByLabel("分類名稱").fill("快捷分類");
  await page.getByRole("button", { name: "新增並選取" }).click();
  await expect(page.getByRole("dialog", { name: "新增用途分類" })).not.toBeVisible();
  await expect(page.getByLabel("用途分類", { exact: true })).toHaveValue(/.+/);

  await page.getByLabel("卡片名稱").fill("E2E Card");
  await page.getByLabel("網址代稱").fill("e2e-tool");
  await page.getByLabel("卡片摘要").fill("可搜尋的端對端正式卡片資料。");
  await page.getByLabel("完整介紹").fill("這張卡片由管理員表單寫入真實隔離資料庫，並透過公開詳情頁讀取。");
  await page.getByLabel("發布狀態").selectOption("published");
  await page.getByRole("searchbox", { name: "搜尋 Tag" }).fill("E2E");
  await page.getByLabel("E2E 標籤").check();
  await page.getByRole("searchbox", { name: "搜尋 Tag" }).fill("開源");
  await page.getByLabel("開源").check();
  await expect(page.getByLabel("已選 Tag").getByText("E2E 標籤")).toBeVisible();
  await expect(page.getByLabel("已選 Tag").getByText("開源")).toBeVisible();
  await page.getByPlaceholder("來源名稱").first().fill("正式下載");
  await page.getByPlaceholder("提供者").first().fill("Example Provider");
  await page.getByPlaceholder("補充標示（選填）").first().fill("Web");
  await page.getByPlaceholder("https://…").first().fill("https://example.com/e2e-tool");
  await page.getByRole("button", { name: "建立卡片" }).click();
  await expect(page).toHaveURL(/\/admin\/tools$/);
  await expect(page.getByText("E2E Card", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.getByRole("searchbox", { name: "搜尋標籤、分類或卡片名稱" }).fill("端對端");
  await expect(page.getByText("E2E Card", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /查看卡片詳情/ }).click();
  await expect(page).toHaveURL(/\/tools\/e2e-tool$/);
  await expect(page.getByRole("link", { name: "前往來源" })).toHaveAttribute(
    "href",
    "https://example.com/e2e-tool",
  );

  await page.goto("/admin/tools");
  await page.getByRole("link", { name: "編輯" }).last().click();
  await page.getByLabel("卡片名稱").fill("E2E Card Updated");
  await page.getByRole("button", { name: "儲存卡片" }).click();
  await expect(page.getByText("E2E Card Updated", { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".soft-surface")
    .filter({ hasText: "E2E Card Updated" })
    .getByRole("button", { name: "刪除" })
    .click();
  await expect(page.getByText("E2E Card Updated", { exact: true })).toHaveCount(0);

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

  await expect(
    page.locator(".soft-surface").filter({ hasText: "快捷分類" }),
  ).toContainText(/category-[a-f0-9]{8}/);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator(".soft-surface")
    .filter({ hasText: "快捷分類" })
    .getByRole("button", { name: "刪除" })
    .click();
  await expect(page.getByText("快捷分類", { exact: true })).toHaveCount(0);
});
