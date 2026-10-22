import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthEndpoint, sensitiveSessionMiddleware } from "better-auth/api";
import { verifyPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";

import { z } from "zod";

import { db } from "@/db";
import { account, schema, session, user } from "@/db/schema";
import { createPublicId } from "@/lib/public-id";
import { hasSameOrigin } from "@/lib/request-origin";

export function validateUsername(value: string, currentUserId?: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 60) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_USERNAME",
      message: "Username must contain 2–60 characters.",
    });
  }

  const existing = db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(trim(${user.name}))`, sql`lower(trim(${name}))`))
    .get();
  if (existing && existing.id !== currentUserId) {
    throw new APIError("CONFLICT", {
      code: "USERNAME_TAKEN",
      message: "This username is already in use.",
    });
  }
  return name;
}

function createAuth() {
  return betterAuth({
    appName: "CardThings",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    rateLimit: {
      customRules: { "/account-email": { window: 10, max: 3 } },
    },
    plugins: [{
      id: "account-email",
      endpoints: {
        updateAccountEmail: createAuthEndpoint("/account-email", {
          method: "POST",
          body: z.object({
            newEmail: z.email().max(254).transform((value) => value.toLowerCase()),
            currentPassword: z.string().min(1).max(128),
          }).strict(),
          use: [sensitiveSessionMiddleware],
        }, async (ctx) => {
          if (!ctx.request || !hasSameOrigin(ctx.request)) {
            throw new APIError("FORBIDDEN", { message: "請從本站提交變更。" });
          }
          const currentUser = ctx.context.session.user;
          const credential = db.select({ password: account.password }).from(account)
            .where(and(eq(account.userId, currentUser.id), eq(account.providerId, "credential"))).get();
          if (!credential?.password || !await verifyPassword({ hash: credential.password, password: ctx.body.currentPassword })) {
            throw new APIError("BAD_REQUEST", { message: "目前密碼不正確。" });
          }
          const email = ctx.body.newEmail;
          if (email === currentUser.email) throw new APIError("BAD_REQUEST", { message: "請輸入不同的電子郵件。" });
          if (db.select({ id: user.id }).from(user).where(eq(user.email, email)).get()) {
            throw new APIError("CONFLICT", { message: "這個電子郵件已被使用，請換一個。" });
          }
          db.transaction((tx) => {
            tx.update(user).set({ email, emailVerified: false, updatedAt: new Date() }).where(eq(user.id, currentUser.id)).run();
            tx.delete(session).where(eq(session.userId, currentUser.id)).run();
          });
          return ctx.json({ status: true });
        }),
      },
    }],
    databaseHooks: {
      user: {
        create: {
          async before(data) {
            return { data: { ...data, name: validateUsername(data.name) } };
          },
        },
        update: {
          async before(data, context) {
            if (data.name === undefined) return;
            return {
              data: {
                ...data,
                name: validateUsername(data.name, context?.context.session?.user.id),
              },
            };
          },
        },
      },
    },
    user: {
      additionalFields: {
        publicId: {
          type: "string",
          required: true,
          input: false,
          unique: true,
          defaultValue: createPublicId,
        },
        role: {
          type: ["user", "admin"],
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
