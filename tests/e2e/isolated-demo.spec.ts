import { expect, test } from "@playwright/test";

test("explicit Demo personas stay browser-local and can log out", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });

  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "选择示例身份" })).toBeVisible();
  await expect(page.getByText("demo.user@example.test")).toBeVisible();
  await expect(page.getByText("demo.admin@example.test")).toBeVisible();

  await page.getByRole("button", { name: "以普通用戶 Demo 進入" }).click();
  await expect(page).toHaveURL(/\/user$/);
  await expect(page.getByRole("heading", { name: "歡迎回來，示例用戶" })).toBeVisible();
  await page.getByRole("button", { name: "退出體驗模式" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  expect(writes).toEqual([]);
});

test("isolated Demo administrator stays within the mobile viewport", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile layout check runs on the mobile project.");

  await page.goto("/demo");
  await page.getByRole("button", { name: "以管理員 Demo 進入" }).click();
  await expect(page.getByRole("heading", { name: "管理總覽" })).toBeVisible();

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test("isolated Demo administrator can edit and reset fictional content", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Complete administrator CRUD is covered once on desktop.");
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });

  await page.goto("/demo");
  await page.getByRole("button", { name: "以管理員 Demo 進入" }).click();
  await expect(page).toHaveURL(/\/demo\/admin$/);
  await expect(page.getByRole("heading", { name: "管理總覽" })).toBeVisible();

  await page.getByRole("button", { name: "用途分類管理" }).click();
  await page.getByLabel("分類名稱").fill("Demo 分类");
  await page.getByLabel("Slug").fill("demo-category");
  await page.getByRole("button", { name: "新增分類" }).click();
  await expect(page.getByText("Demo 分类", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Tag 管理" }).click();
  await page.getByLabel("Tag名稱").fill("Demo Tag");
  await page.getByLabel("Slug").fill("demo-tag");
  await page.getByRole("button", { name: "新增Tag" }).click();
  await expect(page.getByText("Demo Tag", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "工具管理" }).click();
  await page.getByLabel("工具名稱").fill("Demo Tool");
  await page.getByLabel("Slug").fill("demo-tool");
  await page.getByLabel("用途分類").selectOption({ label: "Demo 分类" });
  await page.getByLabel("發布狀態").selectOption("published");
  await page.getByLabel("平台（逗号分隔）").fill("Web, iOS");
  await page.getByLabel("摘要").fill("只保存在浏览器会话中的虚构示例工具。");
  await page.getByRole("button", { name: "新增工具" }).click();
  await expect(page.getByText("Demo Tool", { exact: true })).toBeVisible();

  await page.getByTestId("demo-tool-row-demo-tool").getByRole("button", { name: "編輯" }).click();
  await page.getByLabel("工具名稱").fill("Demo Tool Updated");
  await page.getByRole("button", { name: "儲存工具" }).click();
  await expect(page.getByText("Demo Tool Updated", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "個人資料" }).click();
  await page.getByLabel("用戶名").fill("更新后的示例管理員");
  await page.getByRole("button", { name: "儲存資料 · Demo" }).click();
  await expect(page.getByRole("status")).toContainText("资料已更新");

  await page.getByRole("button", { name: "重置 Demo 数据" }).click();
  await page.getByRole("button", { name: "確認重置" }).click();
  await page.getByRole("button", { name: "工具管理" }).click();
  await expect(page.getByText("Demo Tool Updated", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "退出管理員 Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  expect(writes).toEqual([]);
});
