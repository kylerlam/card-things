import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const databasePath = path.resolve(projectRoot, "data/e2e.sqlite");
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

runNode(["scripts/migrate.mjs"]);
runNode([tsxCli, "scripts/seed.ts"]);
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
