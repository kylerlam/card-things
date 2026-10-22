import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { schema, user } from "@/db/schema";
import { createPublicId } from "@/lib/public-id";

function validateUsername(value: string, currentUserId?: string) {
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
