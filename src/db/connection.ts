import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export function resolveDatabasePath(configured = process.env.DATABASE_URL) {
  const value = configured?.trim() || "data/dev.sqlite";
  if (value === ":memory:") return value;
  const withoutProtocol = value.startsWith("file:") ? value.slice(5) : value;
  return path.isAbsolute(withoutProtocol)
    ? withoutProtocol
    : path.resolve(process.cwd(), withoutProtocol);
}

export function createDatabase(databasePath = resolveDatabasePath()) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const sqlite = new Database(databasePath);
  sqlite.pragma("foreign_keys = ON");
  if (databasePath !== ":memory:") sqlite.pragma("journal_mode = WAL");

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
  };
}

export type DatabaseConnection = ReturnType<typeof createDatabase>;
export type CardThingsDatabase = DatabaseConnection["db"];
