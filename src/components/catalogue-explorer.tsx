"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToolIcon } from "@/components/tool-icon";
import type { CatalogueTool } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

const allCategory = "all";

export function CatalogueExplorer({
  categories,
  tools,
}: {
  categories: Category[];
  tools: CatalogueTool[];
}) {
  const [category, setCategory] = useState(allCategory);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  const filtered = useMemo(
    () =>
      tools.filter((tool) => {
        const inCategory = category === allCategory || tool.categorySlug === category;
        const haystack = [
          tool.name,
          tool.summary,
          tool.categoryName,
          ...tool.tags.map((tag) => tag.name),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return inCategory && (!deferredQuery || haystack.includes(deferredQuery));
      }),
    [category, deferredQuery, tools],
  );

  function clearFilters() {
    setCategory(allCategory);
    setQuery("");
  }

  return (
    <div id="catalogue" className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel self-start bg-card p-5" aria-labelledby="category-title">
        <h2 id="category-title" className="mb-3 text-xl font-bold">
          按用途分類
        </h2>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={category === allCategory ? "default" : "outline"}
            aria-pressed={category === allCategory}
            onClick={() => setCategory(allCategory)}
          >
            全部卡片
          </Button>
          {categories.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={category === item.slug ? "default" : "outline"}
              aria-pressed={category === item.slug}
              onClick={() => setCategory(item.slug)}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <section className="wire-panel mb-6 p-5 sm:p-6" aria-labelledby="search-title">
          <h2 id="search-title" className="mb-2 text-lg font-bold">
            搜尋卡片或分類
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：擷取 / 傳檔 / 開源"
                aria-label="搜尋卡片或分類"
                className="h-10 pl-9"
              />
            </div>
            <Button type="button" variant="outline" onClick={clearFilters}>
              清除條件
            </Button>
          </div>
        </section>

        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">卡片列表</h2>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            顯示 {filtered.length} / {tools.length} 張卡片
          </p>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <Card key={tool.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ToolIcon key={tool.officialUrl} name={tool.name} officialUrl={tool.officialUrl} />
                    <div>
                      <CardTitle>{tool.name}</CardTitle>
                      <CardDescription>{tool.categoryName}</CardDescription>
                    </div>
                  </div>
                  {tool.version ? <CardAction>v{tool.version}</CardAction> : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="leading-6">{tool.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full",
                    )}
                  >
                    查看用途與取得方式
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="wire-panel p-10 text-center text-muted-foreground">
            沒有符合目前條件的卡片。請調整搜尋或分類。
          </div>
        )}
      </div>
    </div>
  );
}
