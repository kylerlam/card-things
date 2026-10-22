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
      <main className="page-shell max-w-2xl py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">CardThings 帳戶</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">登入與註冊</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8">
              登入帳戶，或註冊開始使用 CardThings。
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>返回首頁</Link>
        </div>
        {params.emailUpdated === "1" ? (
          <p className="mb-5 rounded-lg border border-border bg-card p-4" role="status">
            電子郵件已更新，請使用新電子郵件重新登入。
          </p>
        ) : null}
        <AccountAuthForm
          initialMode={params.register !== undefined ? "register" : "login"}
        />
      </main>
      <SiteFooter />
    </>
  );
}
