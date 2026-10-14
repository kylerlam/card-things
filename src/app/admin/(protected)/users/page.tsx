import { asc } from "drizzle-orm";

import { AdminUserList } from "@/components/admin-user-list";
import { db } from "@/db";
import { user } from "@/db/schema";

export default function AdminUsersPage() {
  const users = db.select().from(user).orderBy(asc(user.createdAt)).all();

  return (
    <section className="wire-panel p-5">
      <h2 className="text-2xl font-bold">用戶管理</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        搜尋真實伺服器帳戶，並核對角色與驗證狀態。
      </p>
      <AdminUserList
        users={users.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          role: item.role,
          emailVerified: item.emailVerified,
          createdAt: item.createdAt.toISOString().slice(0, 10),
        }))}
      />
    </section>
  );
}
