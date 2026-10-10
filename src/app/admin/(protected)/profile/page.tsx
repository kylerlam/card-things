import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProfilePage() {
  const session = await requireAdmin();

  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">個人資料管理</h2>
      <p className="mt-2 text-muted-foreground">
        目前里程碑只讀顯示已驗證的管理員身份。敏感帳戶修改不會透過普通用戶 Demo 流程處理。
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-border bg-muted p-4"><dt className="text-sm text-muted-foreground">用戶唯一 ID</dt><dd className="mt-2 break-all font-semibold">{session.user.id}</dd></div>
        <div className="border border-border bg-muted p-4"><dt className="text-sm text-muted-foreground">角色</dt><dd className="mt-2 font-semibold">管理員</dd></div>
        <div className="border border-border bg-muted p-4"><dt className="text-sm text-muted-foreground">用戶名</dt><dd className="mt-2 font-semibold">{session.user.name}</dd></div>
        <div className="border border-border bg-muted p-4"><dt className="text-sm text-muted-foreground">電子郵件</dt><dd className="mt-2 break-all font-semibold">{session.user.email}</dd></div>
      </dl>
      <div className="mt-6 border border-dashed border-border p-4 text-sm text-muted-foreground">
        管理員密碼與角色變更屬於安全敏感操作，將在具備重新驗證、審計與恢復流程後另行設計。
      </div>
    </section>
  );
}
