import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { expect, it } from "vitest";

it.each(["account", "rate-limit"])("protects self email changes: %s", (mode) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-email-"));
  const databasePath = path.join(directory, "auth.sqlite");
  const sqlite = new Database(databasePath);
  migrate(drizzle(sqlite), { migrationsFolder: path.resolve("drizzle") });
  sqlite.close();
  try {
    const result = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/account-email-check.mjs", mode], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: mode === "rate-limit" ? "production" : "test", DATABASE_URL: databasePath, BETTER_AUTH_URL: "http://127.0.0.1:3200", BETTER_AUTH_SECRET: "email-unit-test-secret-only-2026" },
      encoding: "utf8", timeout: 20_000,
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("Account email checks passed.");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}, 25_000);
