import { expect, test } from "@playwright/test";

test("administrators save a custom cover independently of automatic icon discovery", async ({ page }, testInfo) => {
  const slug = `collection-image-${testInfo.project.name}`;
  const name = `Collection Book ${testInfo.project.name}`;
  const imageUrl = `/images/test-book-cover-${testInfo.project.name}.svg`;
  const updatedImageUrl = `/images/test-book-cover-${testInfo.project.name}-updated.svg`;
  const referenceUrl = `https://example.test/${slug}`;
  let customCardDiscoveryRequests = 0;
  await page.route("**/api/tool-icon?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("url") === referenceUrl) customCardDiscoveryRequests++;
    await route.fulfill({ json: { sources: [] } });
  });
  await page.route("**/images/test-book-cover-*.svg", (route) => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="384"><rect width="256" height="384" fill="#2563eb"/><path d="M24 36h208v312H24z" fill="none" stroke="white" stroke-width="8"/></svg>',
  }));

  await page.goto("/admin/tools/new");
  await page.getByLabel("電子郵件或 Demo 帳號").fill("admin@example.test");
  await page.getByLabel("密碼").fill("E2e-Only-Password-2026!");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/tools/new");
  await page.getByLabel("卡片名稱").fill(name);
  await page.getByLabel("網址代稱").fill(slug);
  await page.getByLabel("卡片摘要").fill("A book with an administrator-selected portrait cover image.");
  await page.getByLabel("完整介紹").fill("This fictional collection card verifies that books can use their own cover artwork without any software catalogue configuration.");
  await page.getByLabel("卡片圖片 URL（選填）").fill(imageUrl);
  await page.getByLabel("相關來源 URL（選填）").fill(referenceUrl);
  await page.getByLabel("用途分類", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("發布狀態").selectOption("published");
  await page.getByRole("button", { name: "建立卡片", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/tools$/);

  try {
    const row = page.locator(".soft-surface").filter({ hasText: name });
    const editPath = await row.getByRole("link", { name: "編輯", exact: true }).getAttribute("href");
    expect(editPath).toBeTruthy();
    await page.goto("/");
    const cover = page.getByRole("img", { name: `${name} 圖片`, exact: true });
    await cover.scrollIntoViewIfNeeded();
    await expect.poll(() => cover.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(256);
    await expect(cover).toHaveJSProperty("src", new URL(imageUrl, page.url()).href);
    await expect(cover).toHaveCSS("object-fit", "contain");
    const frame = await cover.evaluate((image) => ({
      width: image.parentElement!.getBoundingClientRect().width,
      radius: parseFloat(getComputedStyle(image.parentElement!).borderRadius),
      naturalHeight: (image as HTMLImageElement).naturalHeight,
    }));
    expect(frame.naturalHeight).toBe(384);
    expect(frame.radius).toBeLessThan(frame.width / 2);
    expect(customCardDiscoveryRequests).toBe(0);

    await page.goto(editPath!);
    await expect(page.getByLabel("卡片圖片 URL（選填）")).toHaveValue(imageUrl);
    await page.getByLabel("卡片圖片 URL（選填）").fill(updatedImageUrl);
    await page.getByRole("button", { name: "儲存卡片", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/tools$/);
    await page.goto("/");
    await expect(page.getByRole("img", { name: `${name} 圖片`, exact: true })).toHaveJSProperty("src", new URL(updatedImageUrl, page.url()).href);
    expect(customCardDiscoveryRequests).toBe(0);
  } finally {
    await page.goto("/admin/tools");
    const row = page.locator(".soft-surface").filter({ hasText: name });
    if (await row.count()) {
      page.once("dialog", (dialog) => dialog.accept());
      await row.getByRole("button", { name: "刪除", exact: true }).click();
    }
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  }
});
