import * as nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PRODUCTION_SEED !== "true"
) {
  throw new Error(
    "Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true only for an intentional insert-only seed.",
  );
}

async function main() {
  const [{ db, sqlite }, { seedDatabase }] = await Promise.all([
    import("../src/db/index"),
    import("../src/db/seed"),
  ]);

  try {
    seedDatabase(db);
    console.log(
      "Inserted missing fictional sample records without updating existing rows.",
    );
  } finally {
    sqlite.close();
  }
}

void main();
