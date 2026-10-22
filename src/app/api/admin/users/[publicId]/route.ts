import { APIError } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { account, session, user } from "@/db/schema";
import { getSession, hasAdminRole } from "@/lib/admin-auth";
import { validateUsername } from "@/lib/auth";
import { hasSameOrigin } from "@/lib/request-origin";

const profileInput = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128).optional(),
}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!hasSameOrigin(request)) return Response.json({ error: "請從本站提交變更。" }, { status: 403 });
  const administrator = await getSession();
  if (!administrator) return Response.json({ error: "請先登入。" }, { status: 401 });
  if (!hasAdminRole(administrator)) return Response.json({ error: "只有管理員可以編輯用戶。" }, { status: 403 });

  const parsed = profileInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "請確認用戶名、電子郵件及新密碼格式。" }, { status: 400 });
  const { publicId } = await params;
  const target = db.select().from(user).where(eq(user.publicId, publicId)).get();
  if (!target) return Response.json({ error: "找不到這個用戶。" }, { status: 404 });
  if (target.role !== "user") return Response.json({ error: "此處僅能編輯一般用戶資料。" }, { status: 403 });

  const { name, email, password } = parsed.data;
  try {
    validateUsername(name, target.id);
    const duplicateEmail = db.select({ id: user.id }).from(user).where(eq(user.email, email)).get();
    if (duplicateEmail && duplicateEmail.id !== target.id) {
      return Response.json({ error: "這個電子郵件已被使用，請換一個。" }, { status: 409 });
    }
    const passwordHash = password ? await hashPassword(password) : undefined;
    const credential = and(eq(account.userId, target.id), eq(account.providerId, "credential"));
    if (passwordHash && !db.select({ id: account.id }).from(account).where(credential).get()) {
      return Response.json({ error: "這個帳戶未設定密碼登入。" }, { status: 400 });
    }
    db.transaction((tx) => {
      tx.update(user).set({ name, email, emailVerified: email === target.email && target.emailVerified, updatedAt: new Date() })
        .where(eq(user.id, target.id)).run();
      if (passwordHash) tx.update(account).set({ password: passwordHash, updatedAt: new Date() }).where(credential).run();
      if (passwordHash || email !== target.email) tx.delete(session).where(eq(session.userId, target.id)).run();
    });
    return Response.json({ message: passwordHash ? "用戶資料與密碼已更新，該用戶需重新登入。" : "用戶資料已更新。" });
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "USERNAME_TAKEN") {
      return Response.json({ error: "這個用戶名已被使用，請換一個。" }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return Response.json({ error: "用戶名或電子郵件已被使用，請重新確認。" }, { status: 409 });
    }
    throw error;
  }
}
