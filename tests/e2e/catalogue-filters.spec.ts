import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("category, tag, and text filters intersect and can be cleared independently", async ({ page }) => {
  await page.goto("/?category=transfer#catalogue");
  const tags = page.getByRole("complementary", { name: "標籤篩選" });
  const search = page.getByRole("searchbox", { name: "搜尋標籤、分類或卡片名稱" });
  const empty = page.getByText("沒有符合目前條件的卡片。請調整搜尋、分類或標籤。", { exact: true });

  await tags.getByRole("button", { name: "本機優先", exact: true }).click();
  await search.fill("Relay");
  await expect(page.locator('[aria-label="目前篩選條件"]')).toBeVisible();
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);
  await expect(page.getByText("BootForge", { exact: true })).toHaveCount(0);

  await tags.getByRole("button", { name: "團隊協作", exact: true }).click();
  await expect(empty).toBeVisible();
  await page.getByRole("button", { name: "清除標籤：團隊協作", exact: true }).click();
  await expect(search).toHaveValue("Relay");
  await expect(page.getByRole("button", { name: "清除分類：檔案與同步", exact: true })).toBeVisible();
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();

  await search.fill("Frame");
  await expect(empty).toBeVisible();
  await page.getByRole("button", { name: "清除分類：檔案與同步", exact: true }).click();
  await expect(search).toHaveValue("Frame");
  await expect(page.getByText("FrameSnap", { exact: true })).toBeVisible();
  await tags.getByRole("button", { name: "開源", exact: true }).click();
  await expect(empty).toBeVisible();
  await search.clear();
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("BootForge", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "清除條件", exact: true }).click();
  await expect(tags.getByRole("button", { name: "全部標籤", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[aria-label="目前篩選條件"]')).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("顯示 3 / 3 張卡片");
  await search.fill("開源");
  await expect(page.getByText("RelayDrop", { exact: true })).toBeVisible();
  await expect(page.getByText("BootForge", { exact: true })).toBeVisible();
  await expect(page.getByText("FrameSnap", { exact: true })).toHaveCount(0);
});

test("more than ten tags remain searchable and expandable at mobile and desktop widths", async ({ page, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "One isolated tag lifecycle covers both viewport widths.");
  test.setTimeout(90_000);
  const suffix = randomUUID().slice(0, 8);
  const created: { id: string; name: string }[] = [];
  const names = ["開源", "本機優先", "團隊協作"];
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { Origin: baseURL! },
    data: { email: "admin@example.test", password: "E2e-Only-Password-2026!" },
  });
  expect(response.status()).toBe(200);

  try {
    await page.goto("/admin/tags");
    for (let index = 0; index < 8; index++) {
      const name = `Filter ${suffix} ${index}`;
      await page.getByLabel("Tag 名稱").fill(name);
      await page.getByLabel("網址代稱").fill(`filter-${suffix}-${index}`);
      await page.getByRole("button", { name: "新增 Tag", exact: true }).click();
      const row = page.locator(".soft-surface").filter({ has: page.getByText(name, { exact: true }) });
      await expect(row).toBeVisible();
      const href = await row.getByRole("link", { name: "編輯", exact: true }).getAttribute("href");
      const id = new URL(href!, baseURL).searchParams.get("edit");
      expect(id).toBeTruthy();
      created.push({ id: id!, name });
      names.push(name);
    }

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const tags = page.getByRole("complementary", { name: "標籤篩選" });
      const options = tags.locator("button[aria-pressed]");
      await expect(options).toHaveCount(11);
      const visible = (await options.allTextContents()).map((name) => name.trim());
      const hidden = names.find((name) => !visible.includes(name));
      expect(hidden).toBeTruthy();
      const search = tags.getByRole("searchbox", { name: "搜尋標籤", exact: true });
      await search.fill(hidden!);
      const selected = tags.getByRole("button", { name: hidden!, exact: true });
      await expect(selected).toBeVisible();
      await selected.click();
      await expect(selected).toHaveAttribute("aria-pressed", "true");
      await search.fill(`no-match-${suffix}`);
      await expect(selected).toBeVisible();
      await search.clear();
      await expect(selected).toBeVisible();
      await expect(options).toHaveCount(11);
      await tags.getByRole("button", { name: "全部標籤", exact: true }).click();
      await tags.getByRole("button", { name: "顯示全部標籤", exact: true }).click();
      await expect(tags.getByRole("button", { name: "收合標籤", exact: true })).toHaveAttribute("aria-expanded", "true");
      await expect(options).toHaveCount(12);
      await selected.scrollIntoViewIfNeeded();
      await expect(selected).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await tags.getByRole("button", { name: "收合標籤", exact: true }).click();
      await expect(tags.getByRole("button", { name: "顯示全部標籤", exact: true })).toHaveAttribute("aria-expanded", "false");
      await expect(options).toHaveCount(11);
    }
  } finally {
    await page.goto("/admin/tags");
    for (const { id } of created) {
      const row = page.locator(".soft-surface").filter({ has: page.locator(`input[name="id"][value="${id}"]`) });
      page.once("dialog", (dialog) => dialog.accept());
      await row.getByRole("button", { name: "刪除", exact: true }).click();
      await expect(row).toHaveCount(0);
    }
  }
});
