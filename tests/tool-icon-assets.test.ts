import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { expect, it } from "vitest";

import catalogue from "../deployments/local-preview/catalogue.json";

it("ships a vector or high-resolution official icon for every curated card", async () => {
  for (const card of catalogue.cards) {
    expect(card.iconUrl, card.name).toMatch(/^\/tool-icons\/[a-z0-9-]+\.(png|svg)$/);
    const file = path.join(process.cwd(), "public", card.iconUrl);
    expect(fs.existsSync(file), card.name).toBe(true);
    const metadata = await sharp(file).metadata();
    if (metadata.format !== "svg") {
      expect(metadata.width, card.name).toBeGreaterThanOrEqual(256);
      expect(metadata.height, card.name).toBeGreaterThanOrEqual(256);
    }
  }
});
