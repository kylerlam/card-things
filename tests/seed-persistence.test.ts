import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterAll, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/connection";
import { seedDatabase } from "../src/db/seed";
import { tools } from "../src/db/schema";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cardthings-test-"));
const databasePath = path.join(temporaryDirectory, "persistence.sqlite");
const migrationsFolder = path.resolve(process.cwd(), "drizzle");

afterAll(() => {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("safe deterministic seed", () => {
  it("is insert-only and persists existing edits across reopen and reseed", () => {
    const first = createDatabase(databasePath);
    migrate(first.db, { migrationsFolder });
    seedDatabase(first.db);
    first.db
      .update(tools)
      .set({ summary: "Locally edited summary", updatedAt: new Date() })
      .where(eq(tools.id, "tool-framesnap"))
      .run();
    seedDatabase(first.db);
    first.sqlite.close();

    const second = createDatabase(databasePath);
    seedDatabase(second.db);
    const edited = second.db
      .select({ summary: tools.summary })
      .from(tools)
      .where(eq(tools.id, "tool-framesnap"))
      .get();
    const count = second.db.select({ value: sql<number>`count(*)` }).from(tools).get();
    second.sqlite.close();

    expect(edited?.summary).toBe("Locally edited summary");
    expect(count?.value).toBe(4);
  });
});
