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
const initialize = process.argv.slice(2).includes("--initialize");

if (initialize) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
} else if (!fs.existsSync(databasePath)) {
  throw new Error(
    `Database is missing at ${databasePath}. Check the configured path and data mount. Use --initialize only for an intentional new installation.`,
  );
}
const sqlite = new Database(databasePath, { fileMustExist: !initialize });
sqlite.pragma("foreign_keys = ON");

try {
  migrate(drizzle(sqlite), {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  console.log(`Applied migrations to ${databasePath}`);
} finally {
  sqlite.close();
}
