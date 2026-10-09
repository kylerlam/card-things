import { notFound } from "next/navigation";

import { ToolForm } from "@/components/tool-form";
import { getAdminTool, listCategories, listTags } from "@/lib/catalog";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = getAdminTool(id);
  if (!tool) notFound();
  return <ToolForm categories={listCategories()} tags={listTags()} tool={tool} />;
}
