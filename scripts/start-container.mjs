import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const serverEntry = path.resolve(projectRoot, "server.js");
const migration = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (migration.status !== 0) {
  process.exit(migration.status ?? 1);
}

const server = spawn(process.execPath, [serverEntry], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
