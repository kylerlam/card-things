import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const baseURL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3301";
const outputDirectory = resolve("docs/screenshots");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

async function capture(page, path, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(outputDirectory, path), fullPage: true });
}

await capture(desktop, "catalogue-desktop.png", "/");
await capture(desktop, "tool-detail-desktop.png", "/tools/framesnap");
await capture(desktop, "auth-demo-desktop.png", "/auth?register=1");
await capture(desktop, "admin-login-desktop.png", "/admin/login");

await desktop.goto(baseURL, { waitUntil: "networkidle" });
await desktop.evaluate(() => {
  sessionStorage.setItem(
    "cardthings-demo-user-v1",
    JSON.stringify({
      version: 1,
      signedIn: true,
      id: "CT-DEMO-0001",
      name: "示例用戶",
      email: "demo@example.test",
      avatar: null,
      favorites: [
        {
          slug: "framesnap",
          name: "FrameSnap",
          summary: "快速擷取、標註與整理畫面片段。",
        },
      ],
      customTools: [
        {
          id: "demo-custom-1",
          name: "我的離線工具",
          note: "只在這個 Demo 工作階段顯示。",
        },
      ],
    }),
  );
});
await capture(desktop, "user-workspace-desktop.png", "/user");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(baseURL, { waitUntil: "networkidle" });
await mobile.evaluate(() => {
  sessionStorage.setItem(
    "cardthings-demo-user-v1",
    JSON.stringify({
      version: 1,
      signedIn: true,
      id: "CT-DEMO-0001",
      name: "示例用戶",
      email: "demo@example.test",
      avatar: null,
      favorites: [],
      customTools: [],
    }),
  );
});
await capture(mobile, "user-workspace-mobile.png", "/user?view=profile");

await browser.close();
