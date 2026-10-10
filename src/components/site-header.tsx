import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DemoAccountNav } from "./demo-account-nav";

export function SiteHeader() {
  return (
    <header className="border-b-2 border-border bg-card">
      <div className="page-shell flex min-h-17 items-center justify-between gap-6 py-3">
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <strong className="text-2xl font-extrabold tracking-tight">CardThings</strong>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            實用工具分享 · 導航探索
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="主要導覽">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}
          >
            首頁
          </Link>
          <Link
            href="/#catalogue"
            className={cn(buttonVariants({ variant: "ghost" }), "px-2 sm:px-4")}
          >
            工具分類
          </Link>
          <DemoAccountNav />
          <Link
            href="/admin/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden lg:inline-flex",
            )}
          >
            管理入口
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="page-shell mt-14 border-t border-border py-6 text-xs text-muted-foreground">
      CardThings 提供介紹與來源導航；安裝檔由各外部來源提供。
    </footer>
  );
}
