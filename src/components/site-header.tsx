import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AccountNav } from "./account-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card shadow-xs">
      <nav className="page-shell grid min-h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-3" aria-label="主要導覽">
        <Link href="/" className="flex min-w-0 items-baseline gap-2 justify-self-start no-underline">
          <strong className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">CardThings</strong>
          <span className="hidden text-sm text-muted-foreground lg:inline">
            卡片內容分享 · 導航探索
          </span>
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost" }), "px-2 sm:px-3.5")}
        >
          首頁
        </Link>
        <div className="flex items-center justify-self-end">
          <AccountNav />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="page-shell mt-16 border-t border-border py-8 text-xs text-muted-foreground">
      CardThings 提供介紹與來源導航；安裝檔由各外部來源提供。
    </footer>
  );
}
