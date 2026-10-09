import Link from "next/link";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { buttonVariants, Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listCategories } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { deleteCategory, saveCategory } from "../../actions";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = await searchParams;
  const allCategories = listCategories();
  const editing = allCategories.find((item) => item.id === values.edit);

  return (
    <section className="wire-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">用途分類管理</h2>
          <p className="mt-2 text-sm text-muted-foreground">首頁主要分類；被工具使用的分類不可刪除。</p>
        </div>
        {editing ? (
          <Link href="/admin/categories" className={cn(buttonVariants({ variant: "outline" }))}>
            取消編輯
          </Link>
        ) : null}
      </div>

      <form action={saveCategory} className="mt-5 border border-border bg-card p-4">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px]">
            <Field>
              <FieldLabel htmlFor="category-name">分類名稱</FieldLabel>
              <Input id="category-name" name="name" defaultValue={editing?.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
              <Input
                id="category-slug"
                name="slug"
                defaultValue={editing?.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="category-order">排序</FieldLabel>
              <Input
                id="category-order"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={editing?.sortOrder ?? 0}
                required
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="category-description">說明</FieldLabel>
            <Textarea
              id="category-description"
              name="description"
              defaultValue={editing?.description ?? ""}
              maxLength={240}
            />
          </Field>
          <Button type="submit">{editing ? "儲存分類" : "新增分類"}</Button>
        </FieldGroup>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {allCategories.map((category) => (
          <div
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-3"
          >
            <div>
              <strong className="block">{category.name}</strong>
              <span className="text-sm text-muted-foreground">
                {category.slug} · 排序 {category.sortOrder}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/categories?edit=${category.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                編輯
              </Link>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <ConfirmDeleteButton />
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
