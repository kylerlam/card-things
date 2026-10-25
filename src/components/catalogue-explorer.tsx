"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, SearchIcon, XIcon } from "lucide-react";

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
import { catalogueNavigationEvent, readCatalogueView, rememberCatalogueView } from "@/lib/catalogue-navigation";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type Tag = { id: string; name: string; slug: string };

const allCategory = "all";
const subscribeToView = () => () => {};
const serverView = () => null;

export function CatalogueExplorer({
  categories,
  tags,
  tools,
  initialCategory = allCategory,
}: {
  categories: Category[];
  tags: Tag[];
  tools: CatalogueTool[];
  initialCategory?: string;
}) {
  const savedView = useSyncExternalStore(subscribeToView, readCatalogueView, serverView);
  const [selectedCategory, setCategory] = useState<string | null>(null);
  const [selectedTag, setTag] = useState<string | null>(null);
  const [searchQuery, setQuery] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const category = selectedCategory ?? savedView?.category ?? initialCategory;
  const activeCategory = categories.find((item) => item.slug === category);
  const requestedTag = selectedTag ?? savedView?.tag ?? "";
  const tag = tags.some((item) => item.id === requestedTag) ? requestedTag : "";
  const activeTag = tags.find((item) => item.id === tag);
  const query = searchQuery ?? savedView?.query ?? "";
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const restoredView = useRef(false);

  useEffect(() => {
    function navigate(event: Event) {
      const requested = (event as CustomEvent<{ category: string }>).detail.category;
      setCategory(categories.some((item) => item.slug === requested) ? requested : allCategory);
      setTag("");
      setQuery("");
      restoredView.current = true;
    }
    window.addEventListener(catalogueNavigationEvent, navigate);
    return () => window.removeEventListener(catalogueNavigationEvent, navigate);
  }, [categories]);

  useEffect(() => {
    if (!savedView || restoredView.current || deferredQuery !== query.trim().toLocaleLowerCase()) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ left: savedView.x, top: savedView.y, behavior: "instant" });
      restoredView.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [deferredQuery, query, savedView]);

  const orderedTags = useMemo(() => {
    const usage = new Map<string, number>();
    for (const tool of tools) {
      for (const item of tool.tags) usage.set(item.id, (usage.get(item.id) ?? 0) + 1);
    }
    return [...tags].sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name, "zh-Hant"));
  }, [tags, tools]);
  const normalizedTagQuery = tagQuery.trim().toLocaleLowerCase();
  const matchingTags = orderedTags.filter((item) => item.name.toLocaleLowerCase().includes(normalizedTagQuery));
  const expandedTags = showAllTags || !!normalizedTagQuery;
  const previewTags = expandedTags ? matchingTags : matchingTags.slice(0, 10);
  const visibleTags = activeTag && !previewTags.some((item) => item.id === tag)
    ? [activeTag, ...(expandedTags ? previewTags : previewTags.slice(0, 9))]
    : previewTags;

  const filtered = useMemo(
    () =>
      tools.filter((tool) => {
        const inCategory = category === allCategory || tool.categorySlug === category;
        const hasTag = !tag || tool.tags.some((item) => item.id === tag);
        const haystack = [
          tool.name,
          tool.summary,
          tool.categoryName,
          ...tool.tags.map((tag) => tag.name),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return inCategory && hasTag && (!deferredQuery || haystack.includes(deferredQuery));
      }),
    [category, tag, deferredQuery, tools],
  );

  function clearFilters() {
    setCategory(allCategory);
    setTag("");
    setQuery("");
  }

  return (
    <div id="catalogue" className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel self-start bg-card p-4" aria-labelledby="tag-title">
        <h2 id="tag-title" className="mb-3 text-lg font-bold">
          標籤篩選
        </h2>
        {tags.length > 10 ? (
          <Input
            type="search"
            value={tagQuery}
            onChange={(event) => setTagQuery(event.target.value)}
            placeholder="搜尋標籤"
            aria-label="搜尋標籤"
            className="mb-3 h-9"
          />
        ) : null}
        <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
          <Button
            type="button"
            size="sm"
            variant={!tag ? "default" : "outline"}
            aria-pressed={!tag}
            onClick={() => setTag("")}
          >
            全部標籤
          </Button>
          {visibleTags.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={tag === item.id ? "default" : "outline"}
              aria-pressed={tag === item.id}
              onClick={() => setTag(item.id)}
              className="max-w-full"
            >
              <span className="truncate">{item.name}</span>
            </Button>
          ))}
          {!matchingTags.length ? <p className="text-sm text-muted-foreground">沒有符合的標籤。</p> : null}
        </div>
        {tags.length > 10 && !normalizedTagQuery ? (
          <Button type="button" variant="link" size="sm" className="mt-2 px-0" onClick={() => setShowAllTags((value) => !value)} aria-expanded={showAllTags}>
            {showAllTags ? "收合標籤" : "顯示全部標籤"}
          </Button>
        ) : null}
      </aside>

      <div className="min-w-0">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold">卡片列表</h1>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            顯示 {filtered.length} / {tools.length} 張卡片
          </p>
        </div>
        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋標籤、分類或卡片名稱"
                aria-label="搜尋標籤、分類或卡片名稱"
                className="h-12 rounded-none border-0 border-b border-border bg-transparent pr-0 pl-7 shadow-none focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" className="self-end sm:self-auto" onClick={clearFilters}>
              清除條件
            </Button>
          </div>
          {activeCategory || activeTag ? (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="目前篩選條件">
              {activeCategory ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setCategory(allCategory)} aria-label={`清除分類：${activeCategory.name}`}>
                  分類：{activeCategory.name}<XIcon />
                </Button>
              ) : null}
              {activeTag ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setTag("")} aria-label={`清除標籤：${activeTag.name}`}>
                  標籤：{activeTag.name}<XIcon />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <Card key={tool.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ToolIcon key={tool.imageUrl ?? tool.officialUrl} name={tool.name} imageUrl={tool.imageUrl} officialUrl={tool.officialUrl} />
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
                    onNavigate={() => rememberCatalogueView({ category, tag, query, x: window.scrollX, y: window.scrollY }, `/tools/${tool.slug}`)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full",
                    )}
                  >
                    查看卡片詳情
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="wire-panel p-10 text-center text-muted-foreground">
            沒有符合目前條件的卡片。請調整搜尋、分類或標籤。
          </div>
        )}
      </div>
    </div>
  );
}
