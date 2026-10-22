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
        搜尋帳戶、編輯一般用戶資料，或重設登入密碼。
      </p>
      <AdminUserList
        users={users.map((item) => ({
          publicId: item.publicId,
          name: item.name,
          email: item.email,
          role: item.role,
          emailVerified: item.emailVerified,
          image: item.image,
          createdAt: item.createdAt.toISOString().slice(0, 10),
        }))}
      />
    </section>
  );
}
