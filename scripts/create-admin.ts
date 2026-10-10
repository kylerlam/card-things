import * as nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "CardThings Admin";

if (!email || !password) {
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD in the command environment. No default credentials are provided.",
  );
}

if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
}

async function main() {
  const [{ getAuth }, { db, sqlite }, { user }, { eq }] = await Promise.all([
    import("../src/lib/auth"),
    import("../src/db/index"),
    import("../src/db/schema"),
    import("drizzle-orm"),
  ]);

  try {
    const auth = getAuth();
    const existing = db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email!))
      .get();
    if (existing) {
      throw new Error(`A user already exists for ${email}; no account was changed.`);
    }

    const result = await auth.api.signUpEmail({
      body: { email: email!, password: password!, name },
    });

    db.update(user)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(user.id, result.user.id))
      .run();

    console.log(`Created admin account for ${email}.`);
  } finally {
    sqlite.close();
  }
}

void main();
