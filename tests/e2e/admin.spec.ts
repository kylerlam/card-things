import { expect, test } from "@playwright/test";

test("admin routes are protected and authenticated mutations persist", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Covered once on desktop.");
  await page.goto("/admin/tags");
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel("電子郵件").fill("admin@example.test");
  await page.getByLabel("密碼").fill("E2e-Only-Password-2026!");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/tags");
  await page.getByLabel("Tag 名稱").fill("E2E 標籤");
  await page.getByLabel("Slug").fill("e2e-tag");
  await page.getByRole("button", { name: "新增 Tag" }).click();
  await expect(page.getByText("E2E 標籤", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText("E2E 標籤", { exact: true })).toBeVisible();
});
