import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { verifyPassword } from "better-auth/crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";

import { resolveLoginEmail } from "../src/lib/demo-accounts";

const projectRoot = process.cwd();
const directories: string[] = [];
const databases: Database.Database[] = [];

function databasePath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-demo-"));
  directories.push(directory);
  return path.join(directory, "demo.sqlite");
}

function initialize(filename: string) {
  const sqlite = new Database(filename);
  databases.push(sqlite);
  migrate(drizzle(sqlite), { migrationsFolder: path.join(projectRoot, "drizzle") });
  return sqlite;
}

function provision(filename: string, origin = "http://127.0.0.1:3310") {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/create-demo-accounts.ts"], {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: filename, BETTER_AUTH_URL: origin },
    encoding: "utf8",
    timeout: 15_000,
  });
}

afterEach(() => {
  for (const sqlite of databases.splice(0)) sqlite.close();
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("local demo accounts", () => {
  it("resolves only the two demo aliases and normalizes email logins", () => {
    expect(resolveLoginEmail(" CardThings ")).toBe("cardthings@example.test");
    expect(resolveLoginEmail("CARDTHINGS_ADMIN")).toBe("cardthings_admin@example.test");
    expect(resolveLoginEmail(" Person@Example.Test ")).toBe("person@example.test");
    expect(resolveLoginEmail("another_admin")).toBe("another_admin");
  });

  it("creates real role-specific credentials and refuses to reset them on rerun", async () => {
    const filename = databasePath();
    const sqlite = initialize(filename);
    const first = provision(filename);
    expect(first.stderr).toBe("");
    expect(first.status).toBe(0);
    const records = sqlite.prepare(`
      SELECT u.id, u.public_id AS publicId, u.email, u.name, u.role,
             a.account_id AS accountId, a.provider_id AS providerId, a.password
      FROM user u JOIN account a ON a.user_id = u.id ORDER BY u.role
    `).all() as Array<{
      id: string; publicId: string; email: string; name: string; role: string;
      accountId: string; providerId: string; password: string;
    }>;
    expect(records.map(({ email, name, role }) => ({ email, name, role }))).toEqual([
      { email: "cardthings_admin@example.test", name: "cardthings_admin", role: "admin" },
      { email: "cardthings@example.test", name: "cardthings", role: "user" },
    ]);
    for (const record of records) {
      expect(record.publicId).toMatch(/^ct[a-z0-9]{12}$/);
      expect(record.accountId).toBe(record.id);
      expect(record.providerId).toBe("credential");
      expect(record.password).not.toBe("password");
      expect(await verifyPassword({ hash: record.password, password: "password" })).toBe(true);
    }
    expect(records[0].password).not.toBe(records[1].password);

    const second = provision(filename);
    expect(second.status).not.toBe(0);
    expect(second.stderr).toContain("no accounts were changed");
    expect(sqlite.prepare("SELECT count(*) AS count FROM user").get()).toEqual({ count: 2 });
    expect(sqlite.prepare("SELECT password FROM account ORDER BY password").all()).toEqual(
      records.map(({ password }) => ({ password })).sort((a, b) => a.password.localeCompare(b.password)),
    );
  });

  it("does not promote an existing account or partially create the other demo", () => {
    const filename = databasePath();
    const sqlite = initialize(filename);
    sqlite.prepare("INSERT INTO user (id, public_id, email, name, role) VALUES (?, ?, ?, ?, ?)")
      .run("existing", "ct000000000001", "cardthings_admin@example.test", "Existing", "user");
    const result = provision(filename);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("no accounts were changed");
    expect(sqlite.prepare("SELECT id, name, role FROM user").all()).toEqual([
      { id: "existing", name: "Existing", role: "user" },
    ]);
    expect(sqlite.prepare("SELECT count(*) AS count FROM account").get()).toEqual({ count: 0 });
  });

  it("rolls back both user and credential records if an insert fails", () => {
    const filename = databasePath();
    const sqlite = initialize(filename);
    sqlite.exec("CREATE TRIGGER reject_demo BEFORE INSERT ON account BEGIN SELECT RAISE(ABORT, 'test refusal'); END;");
    expect(provision(filename).status).not.toBe(0);
    expect(sqlite.prepare("SELECT count(*) AS count FROM user").get()).toEqual({ count: 0 });
    expect(sqlite.prepare("SELECT count(*) AS count FROM account").get()).toEqual({ count: 0 });
  });

  it.each(["https://example.com", "http://example.com", "https://localhost"])(
    "rejects %s before creating a database",
    (origin) => {
      const filename = databasePath();
      const result = provision(filename, origin);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("loopback HTTP");
      expect(fs.existsSync(filename)).toBe(false);
    },
  );

  it("requires an already initialized local database", () => {
    const filename = databasePath();
    expect(provision(filename).status).not.toBe(0);
    expect(fs.existsSync(filename)).toBe(false);
  });
});
