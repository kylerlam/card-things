import { expect, test } from "@playwright/test";

test("public navigation opens the catalogue, category filters, and About without signing in", async ({ page, baseURL }) => {
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  const search = page.getByRole("searchbox", { name: "搜尋卡片或分類" });
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "關於本站", exact: true })).toBeVisible();
  await navigation.getByRole("link", { name: "工具庫", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/#catalogue`);
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(search).toHaveValue("");

  await navigation.getByRole("button", { name: "分類導覽", exact: true }).click();
  await page.locator('a[href="/?category=transfer#catalogue"]').click();
  await expect(page).toHaveURL(`${baseURL}/?category=transfer#catalogue`);
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("button", { name: "分類導覽", exact: true })).toHaveAttribute("aria-expanded", "false");

  await search.fill("Relay");
  await expect(search).toHaveValue("Relay");
  const filteredUrl = page.url();
  await page.reload();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await navigation.getByRole("link", { name: "關於本站", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/about`);
  await page.goBack();
  await expect(page).toHaveURL(filteredUrl);
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page).toHaveURL(`${baseURL}/about`);

  await navigation.getByRole("button", { name: "分類導覽", exact: true }).click();
  await page.locator('a[href="/?category=capture#catalogue"]').click();
  await expect(page).toHaveURL(`${baseURL}/?category=capture#catalogue`);
  await expect(page.getByRole("button", { name: "畫面與擷取", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(search).toHaveValue("");
  await page.getByRole("link", { name: /查看用途與取得方式/ }).click();
  await expect(page).toHaveURL(`${baseURL}/tools/framesnap`);
  await navigation.getByRole("button", { name: "分類導覽", exact: true }).click();
  await page.locator('a[href="/?category=transfer#catalogue"]').click();
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(search).toHaveValue("");
  await navigation.getByRole("link", { name: "工具庫", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/#catalogue`);
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("FrameSnap", { exact: true })).toBeVisible();
  await navigation.getByRole("link", { name: "首頁", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/#top`);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("search supports continuous typing and caret edits while invalid category links remain clearable", async ({ page }) => {
  await page.goto("/?source=preview&category=unknown#catalogue");
  const search = page.getByRole("searchbox", { name: "搜尋卡片或分類" });
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "檔案與同步", exact: true }).click();
  await search.pressSequentially("Relay");
  await expect(search).toHaveValue("Relay");
  for (let step = 0; step < 4; step++) await search.press("ArrowLeft");
  expect(await search.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(1);
  await search.pressSequentially("X");
  await expect(search).toHaveValue("RXelay");
  await search.press("Backspace");
  await expect(search).toHaveValue("Relay");
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("source")).toBe("preview");
  await page.getByRole("button", { name: "清除條件", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");

  await navigation.getByRole("link", { name: "工具庫", exact: true }).click();
  await page.getByRole("button", { name: "檔案與同步", exact: true }).click();
  await search.fill("Relay");
  await navigation.getByRole("link", { name: "工具庫", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "全部卡片", exact: true })).toHaveAttribute("aria-pressed", "true");

  await navigation.getByRole("button", { name: "分類導覽", exact: true }).click();
  await page.locator('a[href="/?category=transfer#catalogue"]').click();
  await page.getByRole("button", { name: "畫面與擷取", exact: true }).click();
  await search.fill("Frame");
  await navigation.getByRole("button", { name: "分類導覽", exact: true }).click();
  await page.locator('a[href="/?category=transfer#catalogue"]').click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "檔案與同步", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
});
