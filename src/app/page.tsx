import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { listCategories, listPublishedTools } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const categories = listCategories();
  const tools = listPublishedTools();
  const initialCategory = categories.find((item) => item.slug === params.category)?.slug ?? "all";

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">工具探索</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
            發現實用好工具
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8">
            精選軟體與工具，匯集功能介紹與下載來源。
          </p>
        </div>
        <CatalogueExplorer key={initialCategory} initialCategory={initialCategory} categories={categories} tools={tools} />
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
