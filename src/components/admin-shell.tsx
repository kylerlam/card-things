import type { ReactNode } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SignOutButton } from "./sign-out-button";

const navigation = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/tools", label: "工具管理" },
  { href: "/admin/categories", label: "用途分類管理" },
  { href: "/admin/tags", label: "Tag 管理" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b-2 border-border bg-card">
        <div className="page-shell flex min-h-14 items-center justify-between gap-4 py-2">
          <div>
            <Link href="/admin" className="text-2xl font-extrabold tracking-tight">
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
        <p className="eyebrow">管理工作區</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">管理員後台</h1>
        <p className="mt-3 text-muted-foreground">
          管理工具、用途分類、Tag、發布狀態與外部下載來源。
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="wire-panel self-start bg-muted p-4">
            <h2 className="mb-3 text-xl font-bold">管理工作區</h2>
            <nav className="flex flex-col gap-2" aria-label="管理員導覽">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
