import assert from "node:assert/strict";

const { getAuth } = await import("../../src/lib/auth.ts");
const { sqlite } = await import("../../src/db/index.ts");
const auth = getAuth();
const origin = process.env.BETTER_AUTH_URL;
const password = "Email-Test-Password-2026!";
const cookieFrom = (response) => response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
const payload = { newEmail: "changed@example.test", currentPassword: password };
function post(endpoint, body, cookie, suppliedOrigin = origin) {
  return auth.handler(new Request(`${origin}/api/auth/${endpoint}`, {
    method: "POST", headers: { "content-type": "application/json", ...(suppliedOrigin ? { origin: suppliedOrigin } : {}), ...(cookie ? { cookie } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}
async function signup(name) {
  const response = await post("sign-up/email", { name, email: `${name.toLowerCase()}@example.test`, password });
  assert.equal(response.status, 200);
  return { user: (await response.json()).user, cookie: cookieFrom(response) };
}
async function login(email) {
  return post("sign-in/email", { email, password });
}
const getSession = (cookie) => auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { cookie } })).then((response) => response.json());
const identity = (id) => sqlite.prepare("SELECT id, public_id, name, image, role, created_at FROM user WHERE id=?").get(id);

try {
  const first = await signup("EmailOwner");
  if (process.argv[2] === "rate-limit") {
    for (let i = 0; i < 3; i++) assert.equal((await post("account-email", { ...payload, currentPassword: "wrong" }, first.cookie)).status, 400);
    const blocked = await post("account-email", payload, first.cookie);
    assert.equal(blocked.status, 429);
  } else {
    const second = await signup("EmailOther");
    assert.equal((await post("account-email", payload)).status, 401);
    assert.equal((await post("account-email", payload, first.cookie, "https://foreign.example")).status, 403);
    assert.equal((await post("account-email", payload, first.cookie, null)).status, 403);
    for (const body of ["{", {}, { ...payload, newEmail: "invalid" }, { ...payload, newEmail: "x".repeat(255) + "@example.test" }, { ...payload, userId: second.user.id }, { ...payload, publicId: second.user.publicId }, { ...payload, role: "admin" }]) {
      assert.equal((await post("account-email", body, first.cookie)).status, 400);
    }
    assert.equal((await post("account-email", { ...payload, currentPassword: "wrong" }, first.cookie)).status, 400);
    assert.equal((await post("account-email", { ...payload, newEmail: second.user.email.toUpperCase() }, first.cookie)).status, 409);
    assert.equal((await post("account-email", { ...payload, newEmail: first.user.email.toUpperCase() }, first.cookie)).status, 400);
    assert.equal(sqlite.prepare("SELECT email FROM user WHERE id=?").get(first.user.id).email, first.user.email);
    assert.ok(await getSession(first.cookie));

    for (const owner of [first, second]) {
      if (owner === second) sqlite.prepare("UPDATE user SET role='admin' WHERE id=?").run(owner.user.id);
      sqlite.prepare("UPDATE user SET image=?, email_verified=1 WHERE id=?").run(`/api/avatars/${owner.user.publicId}-example.png`, owner.user.id);
      const before = identity(owner.user.id);
      const credential = sqlite.prepare("SELECT password FROM account WHERE user_id=?").get(owner.user.id).password;
      const anotherSession = await login(owner.user.email);
      assert.equal(anotherSession.status, 200);
      const otherCookie = cookieFrom(anotherSession);
      assert.ok(sqlite.prepare("SELECT count(*) AS count FROM session WHERE user_id=?").get(owner.user.id).count >= 2);
      const nextEmail = `${owner.user.name.toLowerCase()}-changed@example.test`;
      assert.equal((await post("account-email", { ...payload, newEmail: nextEmail.toUpperCase() }, owner.cookie)).status, 200);
      assert.deepEqual(identity(owner.user.id), before);
      assert.deepEqual(sqlite.prepare("SELECT email, email_verified FROM user WHERE id=?").get(owner.user.id), { email: nextEmail, email_verified: 0 });
      assert.equal(sqlite.prepare("SELECT password FROM account WHERE user_id=?").get(owner.user.id).password, credential);
      assert.equal(sqlite.prepare("SELECT count(*) AS count FROM session WHERE user_id=?").get(owner.user.id).count, 0);
      assert.equal(await getSession(owner.cookie), null);
      assert.equal(await getSession(otherCookie), null);
      assert.equal((await login(owner.user.email)).status, 401);
      const relogin = await login(nextEmail);
      assert.equal(relogin.status, 200);
      const updated = (await relogin.json()).user;
      assert.equal(updated.publicId, owner.user.publicId);
      assert.equal(updated.role, before.role);
    }
  }
  console.log("Account email checks passed.");
} finally {
  sqlite.close();
}
