import fs from "node:fs";
import path from "node:path";

import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const configured = process.env.DATABASE_URL?.trim() || "data/dev.sqlite";
const value = configured.startsWith("file:") ? configured.slice(5) : configured;
const databasePath = path.isAbsolute(value)
  ? value
  : path.resolve(process.cwd(), value);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");

try {
  migrate(drizzle(sqlite), {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  console.log(`Applied migrations to ${databasePath}`);
} finally {
  sqlite.close();
}
