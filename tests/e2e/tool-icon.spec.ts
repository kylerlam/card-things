import { expect, test } from "@playwright/test";

test("catalogue uses its card placeholder when official icons are missing or broken", async ({ page }) => {
  let brokenImageRequested = false;
  await page.route("**/api/tool-icon?**", async (route) => {
    const officialUrl = new URL(route.request().url()).searchParams.get("url") ?? "";
    const sources = officialUrl.endsWith("/framesnap")
      ? []
      : [`https://icon-fixture.test/${officialUrl.endsWith("/relaydrop") ? "broken.png" : "official.svg"}`];
    await route.fulfill({ json: { sources } });
  });
  await page.route("https://icon-fixture.test/broken.png", async (route) => {
    brokenImageRequested = true;
    await route.fulfill({ contentType: "image/png", body: "invalid image" });
  });
  await page.route("https://icon-fixture.test/official.svg", (route) => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="16" fill="#4f46e5"/></svg>',
  }));

  await page.goto("/");
  await expect(page.getByRole("img", { name: "FrameSnap 預設圖示", exact: true })).toBeVisible();
  await expect.poll(() => brokenImageRequested).toBe(true);
  await expect(page.getByRole("img", { name: "RelayDrop 圖示", exact: true })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "RelayDrop 預設圖示", exact: true })).toBeVisible();

  const official = page.getByRole("img", { name: "BootForge 圖示", exact: true });
  await official.scrollIntoViewIfNeeded();
  await expect.poll(() => official.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("img", { name: "BootForge 預設圖示", exact: true })).toHaveCount(0);
});
