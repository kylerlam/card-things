import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAuthForm } from "@/components/account-auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getSession, hasAdminRole } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, session] = await Promise.all([searchParams, getSession()]);
  if (session) redirect(hasAdminRole(session) ? "/admin" : "/user");

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">CardThings 帳戶</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">登入與註冊</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8">
              使用同一入口登入，系統會依帳戶角色帶你進入對應後台。
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>返回首頁</Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <AccountAuthForm
            initialMode={params.register !== undefined ? "register" : "login"}
          />
          <aside className="wire-panel self-start p-5 sm:p-7">
            <h2 className="text-2xl font-bold">帳戶安全</h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
              <li>密碼由伺服器驗證並安全儲存</li>
              <li>登入階段以安全 Cookie 維持</li>
              <li>伺服器驗證角色後進入對應後台</li>
            </ul>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
