import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { avatarDirectory, normalizeAvatar, readAvatarForm } from "@/lib/avatar-upload";
import { hasSameOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ error: "請從本站上傳頭像。" }, { status: 403 });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "請先登入。" }, { status: 401 });

  let form: FormData;
  try {
    form = await readAvatarForm(request);
  } catch {
    return Response.json({ error: "無法讀取圖片，請使用 2 MB 以下的圖片。" }, { status: 400 });
  }
  const targetPublicId = form.get("targetPublicId");
  if (targetPublicId !== null && (typeof targetPublicId !== "string" || session.user.role !== "admin")) {
    return Response.json({ error: "你沒有權限更改這個頭像。" }, { status: 403 });
  }
  const target = targetPublicId
    ? db.select().from(user).where(eq(user.publicId, targetPublicId)).get()
    : db.select().from(user).where(eq(user.id, session.user.id)).get();
  if (!target) return Response.json({ error: "找不到這個帳戶。" }, { status: 404 });
  if (target.id !== session.user.id && target.role !== "user") {
    return Response.json({ error: "此處僅能編輯一般用戶。" }, { status: 403 });
  }
  const file = form.get("avatar");
  let bytes: Buffer;
  try {
    if (!(file instanceof File)) throw new Error("Missing avatar.");
    bytes = await normalizeAvatar(file);
  } catch {
    return Response.json({ error: "圖片無效，請選擇 PNG、JPEG 或 WebP 圖片後再試。" }, { status: 400 });
  }
  const filename = `${target.publicId}-${randomUUID()}.png`;
  const location = path.join(avatarDirectory(), filename);
  const image = `/api/avatars/${filename}`;
  await mkdir(avatarDirectory(), { recursive: true });
  await writeFile(location, bytes, { flag: "wx" });
  try {
    db.update(user).set({ image, updatedAt: new Date() }).where(eq(user.id, target.id)).run();
  } catch (error) {
    await unlink(location);
    throw error;
  }
  return Response.json({ image });
}
