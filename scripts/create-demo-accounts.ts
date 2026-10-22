import { randomUUID } from "node:crypto";

import * as nextEnv from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { inArray } from "drizzle-orm";

import { createDatabase } from "../src/db/connection";
import { account, user } from "../src/db/schema";
import { demoAccounts } from "../src/lib/demo-accounts";
import { createPublicId } from "../src/lib/public-id";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const origin = new URL(process.env.BETTER_AUTH_URL ?? "");
  if (
    origin.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
  ) {
    throw new Error("Demo accounts require a loopback HTTP BETTER_AUTH_URL.");
  }

  const { db, sqlite } = createDatabase();
  try {
    const hashes = await Promise.all(demoAccounts.map(() => hashPassword("password")));
    db.transaction((tx) => {
      const existing = tx
        .select({ email: user.email })
        .from(user)
        .where(inArray(user.email, demoAccounts.map((demo) => demo.email)))
        .all();
      if (existing.length) {
        throw new Error("A demo email already exists; no accounts were changed.");
      }

      for (const [index, demo] of demoAccounts.entries()) {
        const id = randomUUID();
        tx.insert(user).values({
          id,
          publicId: createPublicId(),
          email: demo.email,
          name: demo.name,
          role: demo.role,
        }).run();
        tx.insert(account).values({
          id: randomUUID(),
          userId: id,
          accountId: id,
          providerId: "credential",
          password: hashes[index],
        }).run();
      }
    });
    console.log("Created local demo accounts: cardthings and cardthings_admin.");
  } finally {
    sqlite.close();
  }
}

void main();
