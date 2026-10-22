import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const { getAuth } = await import("../../src/lib/auth.ts");
const { sqlite } = await import("../../src/db/index.ts");
const { POST } = await import("../../src/app/api/account/avatar/route.ts");
const { GET } = await import("../../src/app/api/avatars/[filename]/route.ts");
const origin = process.env.BETTER_AUTH_URL;
const auth = getAuth();
const image = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#4f46e5" } }).png().toBuffer();

async function signup(name) {
  const response = await auth.handler(new Request(`${origin}/api/auth/sign-up/email`, {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ name, email: `${name.toLowerCase()}@example.test`, password: "Avatar-Test-Password-2026!" }),
  }));
  assert.equal(response.status, 200);
  return { user: (await response.json()).user, cookie: response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ") };
}
function upload(cookie, targetPublicId, suppliedOrigin = origin, file = image) {
  const form = new FormData();
  form.set("avatar", new File([file], "avatar.png", { type: "image/png" }));
  if (targetPublicId) form.set("targetPublicId", targetPublicId);
  return POST(new Request(`${origin}/api/account/avatar`, { method: "POST", headers: { origin: suppliedOrigin, ...(cookie ? { cookie } : {}) }, body: form }));
}
function fetchAvatar(url, cookie) {
  return GET(new Request(`${origin}${url}`, { headers: cookie ? { cookie } : {} }), { params: Promise.resolve({ filename: url.split("/").pop() }) });
}

try {
  const first = await signup("FirstAvatar");
  const second = await signup("SecondAvatar");
  const admin = await signup("AvatarAdmin");
  const otherAdmin = await signup("OtherAdmin");
  sqlite.prepare("UPDATE user SET role='admin' WHERE id IN (?, ?)").run(admin.user.id, otherAdmin.user.id);
  assert.equal((await upload()).status, 401);
  assert.equal((await upload(first.cookie, undefined, "https://foreign.example")).status, 403);
  assert.equal((await upload(first.cookie, second.user.publicId)).status, 403);
  assert.equal((await upload(first.cookie, undefined, origin, Buffer.from("not an image"))).status, 400);
  const saved = await upload(first.cookie);
  assert.equal(saved.status, 200);
  const location = (await saved.json()).image;
  assert.equal(sqlite.prepare("SELECT image FROM user WHERE id=?").get(first.user.id).image, location);
  assert.equal((await fetchAvatar(location)).status, 401);
  assert.equal((await fetchAvatar(location, second.cookie)).status, 404);
  const loaded = await fetchAvatar(location, first.cookie);
  assert.equal(loaded.status, 200);
  assert.equal(loaded.headers.get("content-type"), "image/png");
  assert.equal(loaded.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual((({ format, width, height }) => ({ format, width, height }))(await sharp(Buffer.from(await loaded.arrayBuffer())).metadata()), { format: "png", width: 512, height: 512 });
  assert.equal((await upload(admin.cookie, otherAdmin.user.publicId)).status, 403);
  const edited = await upload(admin.cookie, second.user.publicId);
  assert.equal(edited.status, 200);
  const targetLocation = (await edited.json()).image;
  assert.equal(sqlite.prepare("SELECT image FROM user WHERE id=?").get(second.user.id).image, targetLocation);
  assert.equal((await fetchAvatar(targetLocation, admin.cookie)).status, 200);
  sqlite.prepare("UPDATE user SET image=? WHERE id=?").run(targetLocation, first.user.id);
  assert.equal((await fetchAvatar(targetLocation, first.cookie)).status, 404);
  assert.equal(sqlite.prepare("SELECT public_id FROM user WHERE id=?").get(second.user.id).public_id, second.user.publicId);
  const files = await fs.readdir(path.join(process.env.UPLOAD_DIR, "avatars"));
  assert.equal(files.length, 2);
  console.log("Avatar API checks passed.");
} finally {
  sqlite.close();
}
