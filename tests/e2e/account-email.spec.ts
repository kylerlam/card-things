import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("users can cancel, correct, and save their email then sign in with the new address", async ({ page, baseURL }) => {
  const suffix = randomUUID().slice(0, 8);
  const name = `Email ${suffix}`;
  const email = `email-${suffix}@example.test`;
  const nextEmail = `updated-${suffix}@example.test`;
  const password = "Email-Profile-Password-2026!";
  const signup = await page.request.post("/api/auth/sign-up/email", { headers: { Origin: baseURL! }, data: { name, email, password } });
  expect(signup.status()).toBe(200);
  const { user } = await signup.json();
  await page.goto("/user?view=profile");
  await expect(page.getByText(user.publicId, { exact: true })).toHaveCSS("user-select", "none");
  await page.getByRole("button", { name: "編輯電子郵件" }).click();
  await page.getByLabel("新電子郵件").fill(nextEmail);
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByLabel("新電子郵件")).toHaveCount(0);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "編輯電子郵件" }).click();
  await page.getByLabel("新電子郵件").fill(nextEmail.toUpperCase());
  await page.getByLabel("確認目前密碼").fill("wrong");
  await page.getByRole("button", { name: "儲存電子郵件" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("目前密碼不正確。");
  await page.getByLabel("確認目前密碼").fill(password);
  await page.getByRole("button", { name: "儲存電子郵件" }).click();
  await expect(page).toHaveURL(/\/auth\?emailUpdated=1$/);
  await expect(page.getByRole("status")).toHaveText("電子郵件已更新，請使用新電子郵件重新登入。");
  await page.getByLabel("電子郵件或 Demo 帳號").fill(nextEmail);
  await page.getByLabel("密碼", { exact: true }).fill(password);
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/user$/);
  await page.goto("/user?view=profile");
  await page.reload();
  await expect(page.getByText(nextEmail, { exact: true })).toBeVisible();
  await expect(page.getByText(user.publicId, { exact: true })).toBeVisible();
  expect((await (await page.request.get("/api/auth/get-session")).json()).user.role).toBe("user");
});
