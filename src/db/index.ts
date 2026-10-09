import {
  createDatabase,
  resolveDatabasePath,
  type DatabaseConnection,
} from "./connection";

const globalDatabase = globalThis as typeof globalThis & {
  __cardThingsDatabase?: DatabaseConnection;
};

const connection =
  globalDatabase.__cardThingsDatabase ?? createDatabase(resolveDatabasePath());

if (process.env.NODE_ENV !== "production") {
  globalDatabase.__cardThingsDatabase = connection;
}

export const db = connection.db;
export const sqlite = connection.sqlite;
export { createDatabase, resolveDatabasePath } from "./connection";
export type { CardThingsDatabase } from "./connection";
