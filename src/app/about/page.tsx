import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "關於本站",
  description: "認識 CardThings 的收藏方式、相關來源與回饋管道。",
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
            把書籍、書籤、軟體或其他收藏整理成卡片，透過介紹、分類、標籤與相關連結，分享自己想收錄的內容。
          </p>
          <Link href="/#catalogue" className={cn(buttonVariants(), "mt-6")}>瀏覽收藏庫</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="wire-panel p-5 sm:p-6" aria-labelledby="selection-title">
            <h2 id="selection-title" className="text-2xl font-bold">收錄方向</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              每個站點自行決定收藏主題、分類與標籤，並為每張卡片填寫介紹和相關來源，方便瀏覽與查找。
            </p>
            <ul className="mt-5 flex list-disc flex-col gap-3 pl-5 leading-7">
              <li><strong>主題自選：</strong>依自己的收藏方向新增卡片。</li>
              <li><strong>介紹完整：</strong>整理名稱、簡介、圖片與補充說明。</li>
              <li><strong>連結清楚：</strong>提供閱讀、取得或其他相關來源，並自行命名連結。</li>
            </ul>
          </section>

          <section className="wire-panel p-5 sm:p-6" aria-labelledby="downloads-title">
            <h2 id="downloads-title" className="text-2xl font-bold">內容與來源</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              CardThings 提供收藏介紹與來源導航。點擊卡片內的相關連結，會前往對應的外部網站；書籍頁面、檔案或其他內容由該來源提供。
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              內容的版本、取得方式與使用條款，請以來源網站的最新資訊為準。
            </p>
          </section>

          <section className="wire-panel p-5 sm:p-6 lg:col-span-2" aria-labelledby="feedback-title">
            <h2 id="feedback-title" className="text-2xl font-bold">回報與建議</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              站點內容由各站管理員維護。若發現 CardThings 的功能問題或有改進建議，可以到專案的 GitHub Issues 提出。
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
