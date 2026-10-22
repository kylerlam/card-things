import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { isAvatarFilename, maximumAvatarBytes, normalizeAvatar, readAvatarForm } from "../src/lib/avatar-upload";

describe("avatar uploads", () => {
  it("decodes and normalizes supported images while rejecting spoofed or excessive input", async () => {
    const jpeg = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#4f46e5" } }).jpeg().toBuffer();
    const output = await normalizeAvatar(new File([new Uint8Array(jpeg)], "photo.jpg", { type: "image/jpeg" }));
    expect(await sharp(output).metadata()).toMatchObject({ format: "png", width: 512, height: 512 });
    await expect(normalizeAvatar(new File(["<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'/>"], "fake.png", { type: "image/png" }))).rejects.toThrow();
    await expect(normalizeAvatar(new File([new Uint8Array(jpeg)], "photo.gif", { type: "image/gif" }))).rejects.toThrow();
    await expect(normalizeAvatar(new File([new Uint8Array(maximumAvatarBytes + 1)], "large.png", { type: "image/png" }))).rejects.toThrow();
  });

  it("bounds multipart bodies and accepts only owner-prefixed generated filenames", async () => {
    const form = new FormData();
    form.set("avatar", new File(["example"], "avatar.png", { type: "image/png" }));
    const request = new Request("http://localhost/api/account/avatar", { method: "POST", body: form });
    expect((await readAvatarForm(request)).get("avatar")).toBeInstanceOf(File);
    const excessive = new Request("http://localhost/api/account/avatar", {
      method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: new Uint8Array(maximumAvatarBytes + 64 * 1024 + 1),
    });
    await expect(readAvatarForm(excessive)).rejects.toThrow(/too large/);
    expect(isAvatarFilename("ctabcdefghijkl-9710544b-2095-4d3b-94ad-5d71a9552d99.png")).toBe(true);
    expect(isAvatarFilename("../9710544b-2095-4d3b-94ad-5d71a9552d99.png")).toBe(false);
  });

  it("requires a session and origin, protects other users, and persists authorized changes", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-avatar-"));
    const databasePath = path.join(directory, "auth.sqlite");
    const sqlite = new Database(databasePath);
    migrate(drizzle(sqlite), { migrationsFolder: path.resolve("drizzle") });
    sqlite.close();
    try {
      const result = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/avatar-api-check.mjs"], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databasePath, UPLOAD_DIR: path.join(directory, "uploads"), BETTER_AUTH_URL: "http://127.0.0.1:3200", BETTER_AUTH_SECRET: "avatar-unit-test-secret-only-2026" },
        encoding: "utf8", timeout: 15_000,
      });
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Avatar API checks passed.");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
