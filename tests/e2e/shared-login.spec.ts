import { expect, test } from "@playwright/test";

for (const account of [
  { login: "cardthings", destination: "/user", otherBackend: "/admin" },
  { login: "cardthings_admin", destination: "/admin", otherBackend: "/user" },
]) {
  test(`${account.login} uses the shared login and server-selected backend`, async ({ page }) => {
    await page.goto(`/auth?next=${encodeURIComponent(account.otherBackend)}`);
    await page.getByLabel("電子郵件或 Demo 帳號").fill(account.login);
    await page.getByLabel("密碼", { exact: true }).fill("password");
    await page.getByRole("button", { name: "登入", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));

    await page.goto("/auth?next=https://example.com");
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));
    await page.goto(account.otherBackend);
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));
    if (account.destination === "/user") {
      await page.goto("/admin/tools");
      await expect(page).toHaveURL(/\/user$/);
    }

    await page.getByRole("button", { name: "登出" }).click();
    await expect(page).toHaveURL(account.destination === "/admin" ? /\/auth$/ : /\/$/);
    await page.goto(account.destination);
    await expect(page).toHaveURL(/\/auth$/);
  });
}

test("legacy administrator login uses the shared login UI", async ({ page }) => {
  await page.goto("/admin/login?next=/admin/tools");
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByLabel("電子郵件或 Demo 帳號")).toBeVisible();
  await expect(page.getByRole("tab", { name: "註冊" })).toBeVisible();
});

test("invalid demo credentials stay on the shared login", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("電子郵件或 Demo 帳號").fill("cardthings_admin");
  await page.getByLabel("密碼", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "登入失敗" })).toBeVisible();
  await expect(page).toHaveURL(/\/auth$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth$/);
});

test("public signup keeps strong passwords and cannot assign an administrator role", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Covered once on desktop.");

  const weakSignup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://127.0.0.1:3200" },
    data: {
      name: "Password policy check",
      email: "weak-signup@example.test",
      password: "password",
      role: "admin",
    },
  });
  expect(weakSignup.ok()).toBe(false);

  const signup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://127.0.0.1:3200" },
    data: {
      name: "Unprivileged registration",
      email: "role-check@example.test",
      password: "Role-Check-Password-2026!",
      role: "admin",
    },
  });
  expect(signup.ok()).toBe(true);
  expect((await signup.json()).user.role).toBe("user");
  await page.goto("/auth?next=/admin");
  await expect(page).toHaveURL(/\/user$/);
  await page.goto("/admin/tools");
  await expect(page).toHaveURL(/\/user$/);
});
