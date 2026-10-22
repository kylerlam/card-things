import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";

const migrationsFolder = path.resolve("drizzle");

function addUser(sqlite: Database.Database, id: string, name: string) {
  sqlite.prepare("INSERT INTO user (id, public_id, email, name) VALUES (?, ?, ?, ?)")
    .run(id, `ct${id.padStart(12, "0")}`, `${id}@example.test`, name);
}

describe("unique usernames", () => {
  it("enforces trimmed, ASCII-case-insensitive names on direct inserts and updates", () => {
    const sqlite = new Database(":memory:");
    try {
      migrate(drizzle(sqlite), { migrationsFolder });
      addUser(sqlite, "1", "FirstUser");
      expect(() => addUser(sqlite, "2", " firstuser ")).toThrow(/user_name_unique/);
      addUser(sqlite, "3", "SecondUser");
      expect(() => sqlite.prepare("UPDATE user SET name = ? WHERE id = ?").run(" FIRSTUSER ", "3"))
        .toThrow(/user_name_unique/);
      expect(sqlite.prepare("SELECT name FROM user ORDER BY id").all()).toEqual([
        { name: "FirstUser" }, { name: "SecondUser" },
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("refuses a conflicting existing database without renaming or deleting users", () => {
    const sqlite = new Database(":memory:");
    try {
      for (const file of ["0000_skinny_fantastic_four.sql", "0001_add-public-id.sql"]) {
        sqlite.exec(fs.readFileSync(path.join(migrationsFolder, file), "utf8").replaceAll("--> statement-breakpoint", ""));
      }
      addUser(sqlite, "1", "ExistingUser");
      addUser(sqlite, "2", " existinguser ");
      const migration = fs.readFileSync(path.join(migrationsFolder, "0002_unique-usernames.sql"), "utf8");
      expect(() => sqlite.exec(migration)).toThrow(/user_name_unique/);
      expect(sqlite.prepare("SELECT id, name FROM user ORDER BY id").all()).toEqual([
        { id: "1", name: "ExistingUser" }, { id: "2", name: " existinguser " },
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("validates real signup and profile APIs while allowing the same user to keep their name", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-username-"));
    const databasePath = path.join(directory, "auth.sqlite");
    const sqlite = new Database(databasePath);
    migrate(drizzle(sqlite), { migrationsFolder });
    sqlite.close();
    try {
      const result = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/username-auth-check.mjs"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: databasePath,
          BETTER_AUTH_URL: "http://127.0.0.1:3200",
          BETTER_AUTH_SECRET: "username-unit-test-secret-only-2026",
        },
        encoding: "utf8",
        timeout: 15_000,
      });
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Username API checks passed.");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
