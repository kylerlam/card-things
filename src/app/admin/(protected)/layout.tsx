import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
