import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { hasAdminRole } from "@/lib/authorization";

export { hasAdminRole } from "@/lib/authorization";

export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || !hasAdminRole(session)) redirect("/admin/login");
  return session;
}

export async function requireUser(callbackUrl = "/user") {
  const session = await getSession();
  if (!session) redirect(`/auth?next=${encodeURIComponent(callbackUrl)}`);
  return session;
}
