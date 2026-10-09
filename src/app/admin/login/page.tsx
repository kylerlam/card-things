import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { buttonVariants } from "@/components/ui/button";
import { getSession, hasAdminRole } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (hasAdminRole(session)) redirect("/admin");
  const values = await searchParams;
  const requested = typeof values.callbackUrl === "string" ? values.callbackUrl : "/admin";
  const callbackUrl = requested.startsWith("/admin") && !requested.startsWith("//")
    ? requested
    : "/admin";

  return (
    <main className="page-shell py-12 sm:py-20">
      <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "mb-8")}>
        返回首頁
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_minmax(260px,1fr)]">
        <div>
          <p className="eyebrow">管理員驗證</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">登入管理工作區</h1>
          <p className="mt-3 mb-6 text-muted-foreground">
            這個里程碑不開放註冊；管理員由擁有者在伺服器端建立。
          </p>
          <AdminLoginForm callbackUrl={callbackUrl} />
        </div>
        <aside className="wire-panel self-start p-6">
          <h2 className="text-2xl font-bold">登入後可管理</h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
            <li>公開與草稿工具</li>
            <li>用途分類與 Tag</li>
            <li>平台、版本與安裝說明</li>
            <li>官方來源與外部鏡像連結</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
