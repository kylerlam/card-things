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
  const [platforms, setPlatforms] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const platformOptions = useMemo(
    () => [...new Set(tools.flatMap((tool) => tool.platforms))].sort(),
    [tools],
  );

  const filtered = useMemo(
    () =>
      tools.filter((tool) => {
        const inCategory = category === allCategory || tool.categorySlug === category;
        const onPlatform =
          !platforms.length || platforms.some((platform) => tool.platforms.includes(platform));
        const haystack = [
          tool.name,
          tool.summary,
          tool.categoryName,
          ...tool.tags.map((tag) => tag.name),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return inCategory && onPlatform && (!deferredQuery || haystack.includes(deferredQuery));
      }),
    [category, deferredQuery, platforms, tools],
  );

  function togglePlatform(platform: string) {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  function clearFilters() {
    setCategory(allCategory);
    setPlatforms([]);
    setQuery("");
  }

  return (
    <div id="catalogue" className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel self-start bg-muted p-4" aria-labelledby="category-title">
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
            全部工具
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
        <section className="wire-panel mb-5 p-4" aria-labelledby="search-title">
          <h2 id="search-title" className="mb-2 text-lg font-bold">
            搜尋工具或用途
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：擷取 / 傳檔 / Windows"
                aria-label="搜尋工具或用途"
                className="h-10 pl-9"
              />
            </div>
            <Button type="button" variant="outline" onClick={clearFilters}>
              清除條件
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="平台篩選">
            <strong className="mr-1 text-sm">平台篩選</strong>
            {platformOptions.map((platform) => (
              <Button
                key={platform}
                type="button"
                size="sm"
                variant={platforms.includes(platform) ? "default" : "outline"}
                aria-pressed={platforms.includes(platform)}
                onClick={() => togglePlatform(platform)}
              >
                {platform}
              </Button>
            ))}
          </div>
        </section>

        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">工具列表</h2>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            顯示 {filtered.length} / {tools.length} 個工具
          </p>
        </div>

        {filtered.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <Card key={tool.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 shrink-0 place-items-center border border-dashed border-border text-sm font-bold">
                      {tool.name.slice(0, 2).toUpperCase()}
                    </div>
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
                    {tool.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
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
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
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
            沒有符合目前條件的工具。請調整搜尋或篩選。
          </div>
        )}
      </div>
    </div>
  );
}
