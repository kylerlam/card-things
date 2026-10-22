import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { avatarDirectory, isAvatarFilename } from "@/lib/avatar-upload";

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });
  const { filename } = await params;
  if (!isAvatarFilename(filename)) return new Response(null, { status: 404 });
  const owner = db.select({ id: user.id }).from(user).where(and(
    eq(user.publicId, filename.slice(0, 14)),
    eq(user.image, `/api/avatars/${filename}`),
  )).get();
  if (!owner || (owner.id !== session.user.id && session.user.role !== "admin")) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(avatarDirectory(), filename));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": "image/png",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    throw error;
  }
}
