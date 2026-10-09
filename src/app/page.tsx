import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { listCategories, listPublishedTools } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function Home() {
  const categories = listCategories();
  const tools = listPublishedTools();

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">工具導航 · 公開卡片</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
            先按用途逛，再看工具
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8">
            選擇想解決的事，瀏覽工具卡片；搜尋和平台篩選在分類旁作輔助。
          </p>
        </div>
        <CatalogueExplorer categories={categories} tools={tools} />
      </main>
      <SiteFooter />
    </>
  );
}
