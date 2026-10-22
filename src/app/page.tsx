import { CatalogueExplorer } from "@/components/catalogue-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { listCategories, listPublishedTools, listTags } from "@/lib/catalog";
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
      <main className="page-shell py-6 sm:py-8">
        <CatalogueExplorer key={initialCategory} initialCategory={initialCategory} categories={categories} tags={listTags().map(({ id, name, slug }) => ({ id, name, slug }))} tools={tools} />
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
