import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "關於本站",
  description: "認識 CardThings 的工具收錄方向、下載來源與回饋方式。",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">CardThings</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">關於本站</h1>
          <p className="mt-3 text-lg leading-8">
            把實用的軟體與工具整理成卡片，讓你從用途、功能介紹與取得來源，找到適合自己的選擇。
          </p>
          <Link href="/#catalogue" className={cn(buttonVariants(), "mt-6")}>瀏覽工具庫</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="wire-panel p-5 sm:p-6" aria-labelledby="selection-title">
            <h2 id="selection-title" className="text-2xl font-bold">收錄方向</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              優先整理具有明確用途與可查證來源的工具，並按日常需求分類，方便瀏覽與比較。
            </p>
            <ul className="mt-5 flex list-disc flex-col gap-3 pl-5 leading-7">
              <li><strong>用途清楚：</strong>說明工具解決的問題與主要功能。</li>
              <li><strong>來源明確：</strong>提供官方網站或專案來源，並標示下載提供者。</li>
              <li><strong>資訊實用：</strong>整理支援平台、安裝提示與授權資訊，協助你自行判斷。</li>
            </ul>
          </section>

          <section className="wire-panel p-5 sm:p-6" aria-labelledby="downloads-title">
            <h2 id="downloads-title" className="text-2xl font-bold">下載與來源</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              CardThings 提供工具介紹與來源導航。點擊卡片內的下載來源，會前往對應的外部網站；安裝檔由該來源提供，本站不代管或重新託管。
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              工具的版本、價格、授權與安裝方式，請以來源網站的最新資訊為準。
            </p>
          </section>

          <section className="wire-panel p-5 sm:p-6 lg:col-span-2" aria-labelledby="feedback-title">
            <h2 id="feedback-title" className="text-2xl font-bold">回報與建議</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              發現卡片資料有誤、連結失效，或想推薦工具，可以到專案的 GitHub Issues 提出，並附上相關卡片與來源連結。
            </p>
            <a
              href="https://github.com/kylerlam/card-things/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
            >
              前往 GitHub 回報
            </a>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
