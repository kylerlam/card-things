import { expect, test } from "@playwright/test";

test("admin workspace stays within the viewport during navigation and editing", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("電子郵件或 Demo 帳號").fill("admin@example.test");
  await page.getByLabel("密碼", { exact: true }).fill("E2e-Only-Password-2026!");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);

  async function expectViewportFits() {
    await expect.poll(() => page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))).toEqual({ width: page.viewportSize()!.width, scroll: page.viewportSize()!.width });
  }

  await expectViewportFits();
  const navigation = page.getByRole("navigation", { name: "管理員導覽" });
  for (const [name, route] of [
    ["用戶管理", "/admin/users"],
    ["卡片管理", "/admin/tools"],
    ["分類管理", "/admin/categories"],
    ["Tag 管理", "/admin/tags"],
  ]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await link.click();
    await expect(page).toHaveURL(route);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expectViewportFits();
  }
  await navigation.getByRole("link", { name: /^個人資料(管理)?$/ }).click();
  await expect(page).toHaveURL("/admin/profile");
  await expect(page.getByRole("heading", { name: "個人資料管理", exact: true })).toBeVisible();
  await expectViewportFits();

  await navigation.getByRole("link", { name: "卡片管理", exact: true }).click();
  await page.getByRole("link", { name: "新增卡片", exact: true }).click();
  await expect(page).toHaveURL("/admin/tools/new");
  await expectViewportFits();
  await page.getByRole("button", { name: "新增分類", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "新增用途分類" });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  await navigation.getByRole("link", { name: "卡片管理", exact: true }).click();
  await page.getByRole("link", { name: "編輯", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "儲存卡片", exact: true })).toBeVisible();
  await expectViewportFits();
});
