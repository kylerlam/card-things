import Link from "next/link";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { buttonVariants, Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { listTags } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { deleteTag, saveTag } from "../../actions";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = await searchParams;
  const allTags = listTags();
  const editing = allTags.find((item) => item.id === values.edit);

  return (
    <section className="wire-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tag 管理</h2>
          <p className="mt-2 text-sm text-muted-foreground">工具的輔助標籤；被工具使用的 Tag 不可刪除。</p>
        </div>
        {editing ? (
          <Link href="/admin/tags" className={cn(buttonVariants({ variant: "outline" }))}>
            取消編輯
          </Link>
        ) : null}
      </div>

      <form action={saveTag} className="soft-surface mt-5 p-4">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tag-name">Tag 名稱</FieldLabel>
              <Input id="tag-name" name="name" defaultValue={editing?.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="tag-slug">Slug</FieldLabel>
              <Input
                id="tag-slug"
                name="slug"
                defaultValue={editing?.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </Field>
          </div>
          <Button type="submit">{editing ? "儲存 Tag" : "新增 Tag"}</Button>
        </FieldGroup>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {allTags.map((tag) => (
          <div
            key={tag.id}
            className="soft-surface flex flex-wrap items-center justify-between gap-3 p-3"
          >
            <div>
              <strong className="block">{tag.name}</strong>
              <span className="text-sm text-muted-foreground">{tag.slug}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/tags?edit=${tag.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                編輯
              </Link>
              <form action={deleteTag}>
                <input type="hidden" name="id" value={tag.id} />
                <ConfirmDeleteButton />
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
