import Link from "next/link";
import { ArrowLeftIcon, ArrowUpRightIcon, BookOpenIcon, DownloadIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { DemoFavoriteButton } from "@/components/demo-favorite-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPublishedToolBySlug } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ToolDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getPublishedToolBySlug(slug);
  if (!tool) notFound();

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "mb-6")}>
          <ArrowLeftIcon data-icon="inline-start" />
          返回工具列表
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="wire-panel p-6 sm:p-8">
            <p className="eyebrow">{tool.categoryName}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {tool.name}
              </h1>
              {tool.version ? <Badge variant="outline">版本 {tool.version}</Badge> : null}
            </div>
            <p className="mt-4 text-xl leading-8">{tool.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
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
            <div className="mt-5">
              <DemoFavoriteButton
                favorite={{ slug: tool.slug, name: tool.name, summary: tool.summary }}
              />
            </div>

            <section className="mt-9 border-t border-border pt-7">
              <h2 className="text-2xl font-bold">這個工具做什麼</h2>
              <p className="mt-3 whitespace-pre-line leading-7">{tool.description}</p>
            </section>

            {tool.installation ? (
              <section className="mt-9 border-t border-border pt-7">
                <h2 className="text-2xl font-bold">安裝提示</h2>
                <p className="mt-3 whitespace-pre-line leading-7">{tool.installation}</p>
              </section>
            ) : null}

            <section className="mt-9 border-t border-border pt-7">
              <h2 className="text-2xl font-bold">來源與授權</h2>
              <p className="mt-3 leading-7">
                {tool.sourceLicense ?? "請在官方來源核對最新授權資訊。"}
              </p>
              {tool.officialUrl ? (
                <a
                  href={tool.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
                >
                  官方介紹頁
                  <ArrowUpRightIcon data-icon="inline-end" />
                </a>
              ) : null}
            </section>
          </article>

          <aside className="flex flex-col gap-4">
            {tool.episodeUrl ? (
              <Card>
                <CardHeader>
                  <CardTitle>影片介紹</CardTitle>
                  <CardDescription>先看介紹，再依平台選擇來源。</CardDescription>
                </CardHeader>
                <CardFooter>
                  <a
                    href={tool.episodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants(), "w-full")}
                  >
                    <BookOpenIcon data-icon="inline-start" />
                    開啟工具介紹
                  </a>
                </CardFooter>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <h2 className="text-base leading-none font-semibold">安裝與下載</h2>
                <CardDescription>
                  檔案保留在外部提供者；CardThings 不代理或重新託管。
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {tool.downloadLinks.length ? (
                  tool.downloadLinks.map((source) => (
                    <div key={source.id} className="border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block">{source.label}</strong>
                          <span className="text-sm text-muted-foreground">
                            {source.provider}
                            {source.platform ? ` · ${source.platform}` : ""}
                          </span>
                        </div>
                        <Badge variant={source.kind === "official" ? "default" : "secondary"}>
                          {source.kind === "official" ? "官方" : "鏡像"}
                        </Badge>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full")}
                      >
                        <DownloadIcon data-icon="inline-start" />
                        前往來源
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">尚未提供下載來源。</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
