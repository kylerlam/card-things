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
  if (!session) redirect("/auth");
  if (!hasAdminRole(session)) redirect("/user");
  return session;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (hasAdminRole(session)) redirect("/admin");
  return session;
}
