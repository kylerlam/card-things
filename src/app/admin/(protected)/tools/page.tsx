import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listAdminTools } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { deleteTool } from "../../actions";

export default function ToolsPage() {
  const tools = listAdminTools();

  return (
    <section className="wire-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">工具管理</h2>
          <p className="mt-2 text-sm text-muted-foreground">草稿保留在後台；發布後才會出現在公開列表。</p>
        </div>
        <Link href="/admin/tools/new" className={cn(buttonVariants())}>
          <PlusIcon data-icon="inline-start" />
          新增工具
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="grid gap-3 border border-border bg-card p-4 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-lg">{tool.name}</strong>
                <Badge variant={tool.status === "published" ? "default" : "secondary"}>
                  {tool.status === "published" ? "已發布" : "草稿"}
                </Badge>
                <Badge variant="outline">{tool.categoryName}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{tool.summary}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/tools/${tool.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                編輯
              </Link>
              <form action={deleteTool}>
                <input type="hidden" name="id" value={tool.id} />
                <ConfirmDeleteButton />
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
