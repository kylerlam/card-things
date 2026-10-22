import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/connection";

const projectRoot = process.cwd();
const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-safety-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runScript(
  script: string,
  databasePath: string,
  args: string[] = [],
) {
  return spawnSync(process.execPath, [path.join(projectRoot, "scripts", script), ...args], {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databasePath },
    encoding: "utf8",
    timeout: 15_000,
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("database initialization safety", () => {
  it("refuses a missing runtime database without creating its parent", () => {
    const parent = temporaryDirectory();
    const directory = path.join(parent, "missing");
    expect(() => createDatabase(path.join(directory, "runtime.sqlite"))).toThrow();
    expect(fs.existsSync(directory)).toBe(false);
    expect(() => createDatabase(path.join(parent, "missing.sqlite"))).toThrow();
    expect(fs.existsSync(path.join(parent, "missing.sqlite"))).toBe(false);

    const memory = createDatabase(":memory:");
    memory.sqlite.close();
  });

  it.each(["migrate.mjs", "start-container.mjs"])(
    "%s refuses a missing database before starting the app",
    (script) => {
      const directory = path.join(temporaryDirectory(), "missing");
      const result = runScript(script, path.join(directory, "runtime.sqlite"));
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("--initialize");
      expect(fs.existsSync(directory)).toBe(false);
    },
  );

  it("initializes explicitly and preserves existing records on ordinary migration", () => {
    const databasePath = path.join(temporaryDirectory(), "new-install", "app.sqlite");
    expect(runScript("migrate.mjs", databasePath, ["--initialize"]).status).toBe(0);
    const first = createDatabase(databasePath);
    expect(first.sqlite.prepare("SELECT count(*) AS count FROM user").get()).toEqual({ count: 0 });
    first.sqlite.exec("CREATE TABLE safety_marker (value TEXT); INSERT INTO safety_marker VALUES ('keep');");
    first.sqlite.close();

    expect(runScript("migrate.mjs", databasePath).status).toBe(0);
    expect(runScript("migrate.mjs", databasePath, ["--initialize"]).status).toBe(0);
    const second = createDatabase(databasePath);
    expect(second.sqlite.prepare("SELECT value FROM safety_marker").get()).toEqual({ value: "keep" });
    second.sqlite.close();
  });
});

describe("end-to-end preflight", () => {
  it.each(["wrong path", "missing flag", "dotenv path", "wrong upload path"])(
    "rejects %s before deleting test files or migrating another database",
    (scenario) => {
      const directory = temporaryDirectory();
      const expected = path.join(directory, "data", "e2e.sqlite");
      fs.mkdirSync(path.dirname(expected));
      for (const suffix of ["", "-wal", "-shm"]) {
        fs.writeFileSync(`${expected}${suffix}`, `keep${suffix}`);
      }
      const selected = path.join(directory, "another.sqlite");
      const existing = new Database(selected);
      existing.exec("CREATE TABLE marker (value TEXT); INSERT INTO marker VALUES ('keep');");
      existing.close();
      const before = fs.readFileSync(selected);
      const env = { ...process.env };
      delete env.__NEXT_PROCESSED_ENV;
      env.CARDTHINGS_TEST_SEED = "true";
      env.DATABASE_URL = selected;
      if (scenario === "missing flag") {
        delete env.CARDTHINGS_TEST_SEED;
        env.DATABASE_URL = expected;
      } else if (scenario === "dotenv path") {
        delete env.DATABASE_URL;
        fs.writeFileSync(path.join(directory, ".env"), `DATABASE_URL=${selected}\n`);
      } else if (scenario === "wrong upload path") {
        env.DATABASE_URL = expected;
        env.UPLOAD_DIR = path.join(directory, "real-uploads");
      }
      const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts/e2e-server.mjs")], {
        cwd: directory,
        env,
        encoding: "utf8",
        timeout: 15_000,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Test server is restricted");
      expect(fs.readFileSync(selected)).toEqual(before);
      for (const suffix of ["", "-wal", "-shm"]) {
        expect(fs.readFileSync(`${expected}${suffix}`, "utf8")).toBe(`keep${suffix}`);
      }
    },
  );
});
