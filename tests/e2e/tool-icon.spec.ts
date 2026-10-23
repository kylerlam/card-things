import { expect, test } from "@playwright/test";

test("catalogue keeps official and fallback icons inside larger circular frames", async ({ page }) => {
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

  for (const icon of [
    page.getByRole("img", { name: "FrameSnap 預設圖示", exact: true }),
    page.getByRole("img", { name: "RelayDrop 預設圖示", exact: true }),
    official,
  ]) {
    const frame = await icon.evaluate((element) => {
      const circle = element.parentElement!;
      const square = circle.parentElement!;
      const circleStyle = getComputedStyle(circle);
      const squareStyle = getComputedStyle(square);
      const outer = square.getBoundingClientRect();
      const inner = circle.getBoundingClientRect();
      const image = element.getBoundingClientRect();
      return {
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
        width: outer.width, height: outer.height,
        padding: parseFloat(squareStyle.paddingLeft),
        gap: inner.left - outer.left - parseFloat(squareStyle.borderLeftWidth),
        circleWidth: inner.width, circleHeight: inner.height,
        radius: parseFloat(circleStyle.borderRadius), overflow: circleStyle.overflow,
        background: circleStyle.backgroundColor,
        contained: image.left >= inner.left && image.top >= inner.top && image.right <= inner.right + 0.1 && image.bottom <= inner.bottom + 0.1,
      };
    });
    expect(frame.width).toBeCloseTo(3 * frame.rem * 1.2, 1);
    expect(frame.height).toBeCloseTo(frame.width, 1);
    expect(frame.padding).toBeCloseTo(0.375 * frame.rem / 2, 1);
    expect(frame.gap).toBeCloseTo(frame.padding, 1);
    expect(frame.circleWidth).toBeCloseTo(frame.circleHeight, 1);
    expect(frame.radius).toBeGreaterThanOrEqual(frame.circleWidth / 2);
    expect(frame.overflow).toBe("hidden");
    expect(frame.background).toBe("rgba(0, 0, 0, 0)");
    expect(frame.contained).toBe(true);
  }
  await expect(official).toHaveCSS("object-fit", "contain");
});


test("icon API prefers the configured official logo and preserves safe website fallbacks", async ({ request }) => {
  const cases = [
    {
      url: "https://www.snipaste.com/",
      sources: ["https://www.snipaste.com/img/logo.svg", "https://www.snipaste.com/favicon.ico"],
    },
    {
      url: "https://example.test/download",
      sources: ["https://example.test/favicon.ico"],
    },
    {
      url: "http://example.test/",
      sources: [],
    },
  ];
  for (const { url, sources } of cases) {
    const response = await request.get(`/api/tool-icon?url=${encodeURIComponent(url)}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ sources });
  }
});
