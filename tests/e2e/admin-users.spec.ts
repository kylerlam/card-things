import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("administrators edit ordinary profiles and reset passwords without changing IDs or roles", async ({ page, browser, request, baseURL }) => {
  const suffix = randomUUID().slice(0, 8);
  const name = `Profile ${suffix}`;
  const email = `profile-${suffix}@example.test`;
  const password = "Original-Profile-Password-2026!";
  const nextPassword = "Updated-Profile-Password-2026!";
  const ordinary = await browser.newContext({ baseURL });
  const headers = { Origin: baseURL! };
  try {
    const registered = await ordinary.request.post("/api/auth/sign-up/email", { headers, data: { name, email, password } });
    expect(registered.status()).toBe(200);
    const { user } = await registered.json();
    const endpoint = `/api/admin/users/${user.publicId}`;
    const data = { name, email };
    expect((await request.post(endpoint, { headers, data })).status()).toBe(401);
    expect((await ordinary.request.post(endpoint, { headers, data })).status()).toBe(403);

    await page.goto("/auth");
    await page.getByLabel("電子郵件或 Demo 帳號").fill("admin@example.test");
    await page.getByLabel("密碼", { exact: true }).fill("E2e-Only-Password-2026!");
    await page.getByRole("button", { name: "登入", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    const adminSession = await (await page.request.get("/api/auth/get-session")).json();
    for (const payload of [{ ...data, role: "admin" }, { ...data, publicId: "replacement" }, { ...data, password: "short" }]) {
      expect((await page.request.post(endpoint, { headers, data: payload })).status()).toBe(400);
    }
    expect((await page.request.post(endpoint, { headers: { Origin: "https://other.example.test" }, data })).status()).toBe(403);
    expect((await page.request.post(`/api/admin/users/${adminSession.user.publicId}`, { headers, data })).status()).toBe(403);

    await page.goto("/admin/users");
    await page.getByRole("searchbox", { name: "搜尋用戶" }).fill(name);
    await page.getByRole("button", { name: `編輯 ${name}`, exact: true }).click();
    const editor = page.getByRole("region", { name: `編輯 ${name} 的資料` });
    await expect(editor).toContainText(`用戶 ID：${user.publicId}（不可修改）`);
    await expect(editor.getByLabel(/用戶 ID/)).toHaveCount(0);
    await editor.getByLabel("用戶名", { exact: true }).fill("cardthings_admin");
    await editor.getByRole("button", { name: "儲存用戶資料" }).click();
    await expect(editor.getByRole("alert")).toHaveText("這個用戶名已被使用，請換一個。");
    await editor.getByLabel("用戶名", { exact: true }).fill(name);
    await editor.getByLabel("電子郵件", { exact: true }).fill("cardthings_admin@example.test");
    await editor.getByRole("button", { name: "儲存用戶資料" }).click();
    await expect(editor.getByRole("alert")).toHaveText("這個電子郵件已被使用，請換一個。");
    await editor.getByLabel("電子郵件", { exact: true }).fill(`updated-${suffix}@example.test`);
    await editor.getByLabel("新密碼", { exact: true }).fill(nextPassword);
    await editor.getByLabel("再次輸入新密碼", { exact: true }).fill(nextPassword);
    await editor.getByRole("button", { name: "儲存用戶資料" }).click();
    await expect(editor.getByRole("status")).toHaveText("用戶資料與密碼已更新，該用戶需重新登入。");
    expect(await (await ordinary.request.get("/api/auth/get-session")).json()).toBeNull();
    const nextEmail = `updated-${suffix}@example.test`;
    expect((await ordinary.request.post("/api/auth/sign-in/email", { headers, data: { email: nextEmail, password } })).status()).toBe(401);
    const login = await ordinary.request.post("/api/auth/sign-in/email", { headers, data: { email: nextEmail, password: nextPassword } });
    expect(login.status()).toBe(200);
    const updated = (await login.json()).user;
    expect(updated.publicId).toBe(user.publicId);
    expect(updated.role).toBe("user");
    expect(updated.email).toBe(nextEmail);
    await page.reload();
    await expect(page.getByText(nextEmail, { exact: false }).first()).toBeVisible();
  } finally {
    await ordinary.close();
  }
});
