import Link from "next/link";

import { DemoAuthForm } from "@/components/demo-auth-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedToolBySlug } from "@/lib/catalog";
import type { DemoFavorite } from "@/lib/demo-user-store";
import { cn } from "@/lib/utils";

function safeNextPath(value: string | string[] | undefined) {
  const candidate = typeof value === "string" ? value : "/user";
  return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/user";
}

export default async function DemoAuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const favoriteSlug = typeof params.favorite === "string" ? params.favorite : null;
  const tool = favoriteSlug ? getPublishedToolBySlug(favoriteSlug) : null;
  const pendingFavorite: DemoFavorite | null = tool
    ? { slug: tool.slug, name: tool.name, summary: tool.summary }
    : null;

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">04 · 登入與註冊 · 安全 Demo</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">登入與註冊</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8">
              {pendingFavorite
                ? `完成表單後會收藏「${pendingFavorite.name}」，並返回工具列表。`
                : "體驗收藏、自訂工具與個人資料流程，不建立真實帳戶。"}
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>取消並返回首頁</Link>
        </div>
        <div className="mb-5 rounded-lg border border-dashed border-border bg-card p-3 text-sm shadow-xs">
          體驗模式：所有資料只保存在目前瀏覽器工作階段；不會發送郵件或保存密碼。
        </div>
        <DemoAuthForm
          initialMode={params.register !== undefined ? "register" : "login"}
          nextPath={safeNextPath(params.next)}
          pendingFavorite={pendingFavorite}
          loggedOut={params.logout !== undefined}
        />
      </main>
      <SiteFooter />
    </>
  );
}
