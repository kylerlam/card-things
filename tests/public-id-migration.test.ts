import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

describe("public id migration", () => {
  it("backfills existing users without changing auth ids or sessions", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    sqlite.exec(`
      CREATE TABLE user (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text NOT NULL,
        email_verified integer DEFAULT false NOT NULL,
        image text,
        role text DEFAULT 'user' NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
      CREATE TABLE session (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE
      );
      INSERT INTO user (id, name, email, role, created_at, updated_at)
      VALUES ('internal-auth-id', 'Existing Admin', 'admin@example.test', 'admin', 1, 1);
      INSERT INTO session (id, user_id) VALUES ('existing-session', 'internal-auth-id');
    `);

    const migration = fs
      .readFileSync(path.resolve("drizzle/0001_add-public-id.sql"), "utf8")
      .replaceAll("--> statement-breakpoint", "");
    sqlite.exec(migration);

    const existing = sqlite
      .prepare("SELECT id, public_id AS publicId, role FROM user")
      .get() as { id: string; publicId: string; role: string };
    const session = sqlite
      .prepare("SELECT user_id AS userId FROM session")
      .get() as { userId: string };

    expect(existing).toEqual({
      id: "internal-auth-id",
      publicId: expect.stringMatching(/^ct[a-f0-9]{12}$/),
      role: "admin",
    });
    expect(session.userId).toBe("internal-auth-id");
    sqlite.close();
  });
});
