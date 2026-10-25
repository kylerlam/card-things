import Link from "next/link";
import { connection } from "next/server";

import { listCategories } from "@/lib/catalog";

import { AccountNav } from "./account-nav";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
  await connection();

  return (
    <header id="top" className="border-b border-border bg-card shadow-xs">
      <nav className="page-shell grid min-h-18 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" aria-label="主要導覽">
        <Link href="/" className="flex min-w-0 items-baseline gap-2 justify-self-start no-underline">
          <strong className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">CardThings</strong>
        </Link>
        <SiteNavigation categories={listCategories().map(({ id, name, slug }) => ({ id, name, slug }))} />
        <div className="col-start-2 row-start-1 flex min-h-[46.8px] items-center justify-self-end md:col-start-3">
          <AccountNav />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="page-shell mt-16 border-t border-border py-8 text-xs text-muted-foreground">
      CardThings 展示收藏介紹與相關連結；外部內容由各來源提供。
    </footer>
  );
}
