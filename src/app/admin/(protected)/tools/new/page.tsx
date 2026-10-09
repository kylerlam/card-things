import { ToolForm } from "@/components/tool-form";
import { listCategories, listTags } from "@/lib/catalog";

export default function NewToolPage() {
  return <ToolForm categories={listCategories()} tags={listTags()} />;
}
