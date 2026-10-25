import type { ReactNode } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AdminNavigation } from "./admin-navigation";
import { SignOutButton } from "./sign-out-button";

export function AdminShell({
  children,
  administrator,
}: {
  children: ReactNode;
  administrator: { name: string; email: string };
}) {
  return (
    <>
      <header className="border-b border-border bg-card shadow-xs">
        <div className="page-shell flex min-h-14 flex-wrap items-center justify-between gap-2 py-2 sm:gap-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href="/admin" className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
              CardThings
            </Link>
            <span className="text-xs text-muted-foreground sm:text-sm">管理員後台</span>
          </div>
          <div className="flex items-center gap-2 max-[360px]:[&_button]:h-8 max-[360px]:[&_button]:px-2 max-[360px]:[&_button]:text-xs">
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "max-[360px]:h-8 max-[360px]:px-2 max-[360px]:text-xs")}>
              返回首頁
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="page-shell py-6 sm:py-10">
        <p className="eyebrow">03 · 管理工作區 · 已驗證管理員</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">管理員後台</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          管理卡片、用途分類、Tag、發布狀態與資源連結。
        </p>
        <div className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="wire-panel min-w-0 self-start bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-xl">管理工作區</h2>
            <AdminNavigation />
            <p className="mt-4 hidden border-t border-border pt-3 text-xs text-muted-foreground lg:block">
              {administrator.name}<br />{administrator.email}
            </p>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
