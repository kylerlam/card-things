type SessionLike = {
  user?: { role?: unknown } | null;
} | null;

export function hasAdminRole(session: SessionLike) {
  return session?.user?.role === "admin";
}
