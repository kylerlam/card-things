import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import nextEnv from "@next/env";

const projectRoot = process.cwd();
nextEnv.loadEnvConfig(projectRoot);

const databasePath = path.resolve(projectRoot, "data/e2e.sqlite");
const configured = process.env.DATABASE_URL?.trim() || "data/dev.sqlite";
const value = configured.startsWith("file:") ? configured.slice(5) : configured;
if (
  process.env.CARDTHINGS_TEST_SEED !== "true" ||
  path.resolve(projectRoot, value) !== databasePath
) {
  throw new Error("Test server is restricted to data/e2e.sqlite with CARDTHINGS_TEST_SEED=true.");
}
process.env.DATABASE_URL = databasePath;

const tsxCli = path.resolve(projectRoot, "node_modules/tsx/dist/cli.mjs");
const nextCli = path.resolve(projectRoot, "node_modules/next/dist/bin/next");

for (const suffix of ["", "-shm", "-wal"]) {
  fs.rmSync(`${databasePath}${suffix}`, { force: true });
}

function runNode(args) {
  execFileSync(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });
}

runNode(["scripts/migrate.mjs", "--initialize"]);
runNode([tsxCli, "scripts/seed-test.ts"]);
runNode([tsxCli, "scripts/create-admin.ts"]);

const server = spawn(
  process.execPath,
  [nextCli, "dev", "--hostname", "127.0.0.1", "--port", "3200"],
  { cwd: projectRoot, env: process.env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
