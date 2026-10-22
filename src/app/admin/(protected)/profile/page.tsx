import { AccountEmailEditor } from "@/components/account-email-editor";
import { AvatarEditor } from "@/components/avatar-editor";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProfilePage() {
  const session = await requireAdmin();

  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">個人資料管理</h2>
      <p className="mt-2 text-muted-foreground">
        查看管理員身份，或更新你的頭像與電子郵件。
      </p>
      <div className="mt-6"><AvatarEditor image={session.user.image ?? null} name={session.user.name} /></div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="soft-surface bg-muted p-4"><dt className="text-sm text-muted-foreground">用戶 ID</dt><dd className="mt-2 select-none font-semibold">{session.user.publicId}</dd></div>
        <div className="soft-surface bg-muted p-4"><dt className="text-sm text-muted-foreground">角色</dt><dd className="mt-2 font-semibold">管理員</dd></div>
        <div className="soft-surface bg-muted p-4"><dt className="text-sm text-muted-foreground">用戶名</dt><dd className="mt-2 font-semibold">{session.user.name}</dd></div>
        <AccountEmailEditor email={session.user.email} />
      </dl>
      <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        管理員密碼與角色變更屬於安全敏感操作，將在具備重新驗證、審計與恢復流程後另行設計。
      </div>
    </section>
  );
}
