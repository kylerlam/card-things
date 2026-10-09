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
  if (!hasAdminRole(session)) redirect("/admin/login");
  return session;
}
