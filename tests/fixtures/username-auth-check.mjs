import assert from "node:assert/strict";

const { getAuth } = await import("../../src/lib/auth.ts");
const { sqlite } = await import("../../src/db/index.ts");
const auth = getAuth();
const origin = process.env.BETTER_AUTH_URL;

async function request(path, body, cookie) {
  return auth.handler(new Request(`${origin}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  }));
}

function signUp(name, email) {
  return request("sign-up/email", { name, email, password: "Username-Test-Password-2026!" });
}

try {
  const first = await signUp(" FirstUser ", "first@example.test");
  assert.equal(first.status, 200);
  const firstUser = (await first.json()).user;
  assert.equal(firstUser.name, "FirstUser");
  assert.equal(firstUser.role, "user");
  const cookie = first.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  assert.ok(cookie);

  const duplicate = await signUp(" firstuser ", "duplicate@example.test");
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).code, "USERNAME_TAKEN");

  const invalid = await signUp("  ", "invalid@example.test");
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).code, "INVALID_USERNAME");
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM user").get().count, 1);

  const second = await signUp("SecondUser", "second@example.test");
  assert.equal(second.status, 200);
  const duplicateUpdate = await request("update-user", { name: " seconduser " }, cookie);
  assert.equal(duplicateUpdate.status, 409);
  assert.equal((await duplicateUpdate.json()).code, "USERNAME_TAKEN");
  assert.equal(sqlite.prepare("SELECT name FROM user WHERE id = ?").get(firstUser.id).name, "FirstUser");

  const selfUpdate = await request("update-user", { name: " FIRSTUSER " }, cookie);
  assert.equal(selfUpdate.status, 200);
  assert.equal(sqlite.prepare("SELECT name FROM user WHERE id = ?").get(firstUser.id).name, "FIRSTUSER");

  const renamed = await request("update-user", { name: " RenamedUser " }, cookie);
  assert.equal(renamed.status, 200);
  assert.equal(sqlite.prepare("SELECT name FROM user WHERE id = ?").get(firstUser.id).name, "RenamedUser");
  const reclaimed = await signUp("FirstUser", "reclaimed@example.test");
  assert.equal(reclaimed.status, 200);
  console.log("Username API checks passed.");
} finally {
  sqlite.close();
}
