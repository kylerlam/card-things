import path from "node:path";

import * as nextEnv from "@next/env";

import { resolveDatabasePath } from "../src/db/connection";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const expectedDatabase = path.resolve(process.cwd(), "data/e2e.sqlite");

async function main() {
  if (
    process.env.CARDTHINGS_TEST_SEED !== "true" ||
    resolveDatabasePath() !== expectedDatabase
  ) {
    throw new Error("Test seed is restricted to data/e2e.sqlite.");
  }

  const [{ db, sqlite }, { seedTestDatabase }] = await Promise.all([
    import("../src/db/index"),
    import("../tests/fixtures/catalogue-seed"),
  ]);

  try {
    seedTestDatabase(db);
    console.log("Inserted isolated end-to-end test fixtures.");
  } finally {
    sqlite.close();
  }
}

void main();
