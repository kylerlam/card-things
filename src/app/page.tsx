import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { listCategories, listPublishedTools } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  const categories = listCategories();
  const tools = listPublishedTools();

  return (
    <>
      <SiteHeader />
      <main id="top" className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">卡片導航 · 公開內容</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
            先按用途逛，再看卡片
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8">
            選擇感興趣的用途，再透過搜尋和 Tag 找到合適的卡片。
          </p>
        </div>
        <CatalogueExplorer categories={categories} tools={tools} />
        <a
          href="#top"
          aria-label="回到頂部"
          title="回到頂部"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "fixed right-4 bottom-4 z-10 bg-card shadow-sm",
          )}
        >
          <ArrowUpIcon />
        </a>
      </main>
      <SiteFooter />
    </>
  );
}
