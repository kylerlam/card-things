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
  administrator: { id: string; name: string; email: string };
}) {
  return (
    <>
      <header className="border-b border-border bg-card shadow-xs">
        <div className="page-shell flex min-h-14 items-center justify-between gap-4 py-2">
          <div>
            <Link href="/admin" className="text-2xl font-extrabold tracking-tight text-primary">
              CardThings
            </Link>
            <span className="ml-2 text-sm text-muted-foreground">管理員後台</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
              返回首頁
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="page-shell py-10">
        <p className="eyebrow">03 · 管理工作區 · 已驗證管理員</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">管理員後台</h1>
        <p className="mt-3 text-muted-foreground">
          管理工具、用途分類、Tag、發布狀態與外部下載來源。
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="wire-panel self-start bg-card p-5">
            <h2 className="mb-3 text-xl font-bold">管理工作區</h2>
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
