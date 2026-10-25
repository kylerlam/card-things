import fs from "node:fs";

import Database from "better-sqlite3";
import { expect, it } from "vitest";

it("adds optional card images without changing existing cards or accounts", () => {
  const sqlite = new Database(":memory:");
  for (const file of ["0000_skinny_fantastic_four.sql", "0001_add-public-id.sql", "0002_unique-usernames.sql"]) {
    sqlite.exec(fs.readFileSync(`drizzle/${file}`, "utf8"));
  }
  sqlite.prepare("INSERT INTO categories (id, slug, name) VALUES (?, ?, ?)").run("books", "books", "Books");
  sqlite.prepare("INSERT INTO tools (id, slug, name, summary, description, category_id) VALUES (?, ?, ?, ?, ?, ?)").run("book", "book", "A book", "A collection book", "An existing card description", "books");
  sqlite.prepare("INSERT INTO user (id, public_id, name, email) VALUES (?, ?, ?, ?)").run("user", "ct123456789abc", "Reader", "reader@example.test");
  const beforeCard = sqlite.prepare("SELECT * FROM tools").get() as Record<string, unknown>;
  const beforeUser = sqlite.prepare("SELECT * FROM user").get();

  sqlite.exec(fs.readFileSync("drizzle/0003_card-image-url.sql", "utf8"));
  expect(sqlite.prepare("SELECT * FROM tools").get()).toEqual({ ...beforeCard, image_url: null });
  expect(sqlite.prepare("SELECT * FROM user").get()).toEqual(beforeUser);
  sqlite.prepare("UPDATE tools SET image_url = ? WHERE id = ?").run("/images/book.svg", "book");
  expect(sqlite.prepare("SELECT image_url FROM tools WHERE id = ?").get("book")).toEqual({ image_url: "/images/book.svg" });
  expect(sqlite.pragma("foreign_key_check")).toEqual([]);
  sqlite.close();
});
