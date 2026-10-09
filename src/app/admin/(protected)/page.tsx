import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminTools, listCategories, listTags } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export default function AdminOverview() {
  const tools = listAdminTools();
  const categories = listCategories();
  const tags = listTags();
  const published = tools.filter((tool) => tool.status === "published").length;

  return (
    <div className="flex flex-col gap-4">
      <section className="wire-panel p-5">
        <h2 className="text-2xl font-bold">管理總覽</h2>
        <p className="mt-2 text-muted-foreground">內容與部署資料保持分開；只有已發布工具出現在首頁。</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [tools.length, "全部工具"],
            [published, "已發布"],
            [categories.length, "用途分類"],
            [tags.length, "Tags"],
          ].map(([value, label]) => (
            <div key={label} className="border border-border bg-card p-4">
              <strong className="block text-3xl">{value}</strong>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["工具管理", "編輯說明、平台、發布狀態和下載來源。", "/admin/tools"],
          ["用途分類", "控制首頁左側的主要分類。", "/admin/categories"],
          ["Tag 管理", "維護工具的輔助標籤。", "/admin/tags"],
        ].map(([title, description, href]) => (
          <Card key={href}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
            <CardFooter>
              <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                開啟
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
