"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";

import { createQuickCategory, saveTool } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogueToolDetail } from "@/lib/catalog";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

export function ToolForm({
  categories,
  tags,
  tool,
}: {
  categories: Category[];
  tags: Tag[];
  tool?: CatalogueToolDetail;
}) {
  const sourceRows = Array.from({ length: 3 }, (_, index) => tool?.downloadLinks[index]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [categoryId, setCategoryId] = useState(tool?.categoryId ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categoryPending, startCategoryTransition] = useTransition();
  const [tagQuery, setTagQuery] = useState("");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set(tool?.tags.map((tag) => tag.id) ?? []),
  );
  const filteredTags = useMemo(() => {
    const query = tagQuery.trim().toLocaleLowerCase();
    return query
      ? tags.filter((tag) => tag.name.toLocaleLowerCase().includes(query))
      : tags;
  }, [tagQuery, tags]);
  const selectedTags = tags.filter((tag) => selectedTagIds.has(tag.id));

  function toggleTag(id: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <form action={saveTool} className="wire-panel p-5">
        <input type="hidden" name="id" value={tool?.id ?? ""} />
        {selectedTags.map((tag) => (
          <input key={tag.id} type="hidden" name="tagId" value={tag.id} />
        ))}
        <div className="mb-5">
          <h2 className="text-2xl font-bold">{tool ? `編輯 ${tool.name}` : "新增卡片"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            外部檔案保留在原始來源；此處只管理卡片內容與連結。
          </p>
        </div>

        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tool-name">卡片名稱</FieldLabel>
              <Input id="tool-name" name="name" defaultValue={tool?.name} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="tool-slug">網址代稱</FieldLabel>
              <Input
                id="tool-slug"
                name="slug"
                defaultValue={tool?.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="tool-summary">卡片摘要</FieldLabel>
            <Input
              id="tool-summary"
              name="summary"
              defaultValue={tool?.summary}
              minLength={10}
              maxLength={220}
              placeholder="請輸入 10–220 個字元的卡片摘要"
              required
            />
            <FieldDescription>至少 10 個字元，最多 220 個字元。</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="tool-description">完整介紹</FieldLabel>
            <Textarea
              id="tool-description"
              name="description"
              defaultValue={tool?.description}
              minLength={20}
              maxLength={4000}
              placeholder="請輸入 20–4000 個字元的完整介紹"
              rows={6}
              required
            />
            <FieldDescription>至少 20 個字元，最多 4000 個字元。</FieldDescription>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="tool-category">用途分類</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dialogRef.current?.showModal()}
                >
                  <PlusIcon data-icon="inline-start" />
                  新增分類
                </Button>
              </div>
              <NativeSelect
                id="tool-category"
                name="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full"
                required
              >
                <NativeSelectOption value="">選擇分類</NativeSelectOption>
                {availableCategories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="tool-status">發布狀態</FieldLabel>
              <NativeSelect
                id="tool-status"
                name="status"
                defaultValue={tool?.status ?? "draft"}
                className="w-full"
              >
                <NativeSelectOption value="draft">草稿</NativeSelectOption>
                <NativeSelectOption value="published">已發布</NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="tool-version">版本</FieldLabel>
            <Input id="tool-version" name="version" defaultValue={tool?.version ?? ""} />
          </Field>

          <FieldSet>
            <FieldLegend>Tags</FieldLegend>
            <div className="relative">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={tagQuery}
                    onFocus={() => setTagPickerOpen(true)}
                    onChange={(event) => {
                      setTagQuery(event.target.value);
                      setTagPickerOpen(true);
                    }}
                    placeholder="搜尋已有 Tag"
                    aria-label="搜尋 Tag"
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={tagPickerOpen}
                  aria-controls="tag-options"
                  onClick={() => setTagPickerOpen((open) => !open)}
                >
                  選擇 Tag{selectedTags.length ? `（${selectedTags.length}）` : ""}
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </div>
              {tagPickerOpen ? (
                <div
                  id="tag-options"
                  role="listbox"
                  aria-multiselectable="true"
                  className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg"
                >
                  {filteredTags.length ? (
                    filteredTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.has(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                        />
                        {tag.name}
                      </label>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      沒有符合搜尋的 Tag。
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex min-h-8 flex-wrap gap-2" aria-label="已選 Tag">
              {selectedTags.length ? (
                selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="gap-1.5 py-1">
                    {tag.name}
                    <button
                      type="button"
                      aria-label={`移除 ${tag.name}`}
                      onClick={() => toggleTag(tag.id)}
                      className="rounded-sm hover:text-foreground"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">尚未選擇 Tag。</span>
              )}
            </div>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="tool-installation">安裝提示</FieldLabel>
            <Textarea
              id="tool-installation"
              name="installation"
              defaultValue={tool?.installation ?? ""}
              rows={4}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tool-license">來源或授權</FieldLabel>
              <Input
                id="tool-license"
                name="sourceLicense"
                defaultValue={tool?.sourceLicense ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tool-official-url">官方介紹 URL</FieldLabel>
              <Input
                id="tool-official-url"
                name="officialUrl"
                type="url"
                defaultValue={tool?.officialUrl ?? ""}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="tool-episode-url">影片介紹 URL</FieldLabel>
            <Input
              id="tool-episode-url"
              name="episodeUrl"
              type="url"
              defaultValue={tool?.episodeUrl ?? ""}
            />
            <FieldDescription>可連到短影片或其他卡片介紹內容。</FieldDescription>
          </Field>

          <FieldSet>
            <FieldLegend>下載來源</FieldLegend>
            <FieldDescription>最多三個來源；每列需同時填寫名稱、提供者與 URL。</FieldDescription>
            <div className="flex flex-col gap-3">
              {sourceRows.map((source, index) => (
                <div key={index} className="soft-surface grid gap-3 p-3 lg:grid-cols-5">
                  <Input name="sourceLabel" defaultValue={source?.label ?? ""} placeholder="來源名稱" />
                  <Input
                    name="sourceProvider"
                    defaultValue={source?.provider ?? ""}
                    placeholder="提供者"
                  />
                  <NativeSelect name="sourceKind" defaultValue={source?.kind ?? "official"} className="w-full">
                    <NativeSelectOption value="official">官方</NativeSelectOption>
                    <NativeSelectOption value="mirror">鏡像</NativeSelectOption>
                  </NativeSelect>
                  <Input
                    name="sourcePlatform"
                    defaultValue={source?.platform ?? ""}
                    placeholder="適用系統"
                  />
                  <Input
                    name="sourceUrl"
                    type="url"
                    defaultValue={source?.url ?? ""}
                    placeholder="https://…"
                  />
                </div>
              ))}
            </div>
          </FieldSet>

          <Button type="submit">{tool ? "儲存卡片" : "建立卡片"}</Button>
        </FieldGroup>
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby="quick-category-title"
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-foreground/25"
        onClose={() => {
          setCategoryError("");
          setNewCategoryName("");
        }}
      >
        <form
          className="p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setCategoryError("");
            startCategoryTransition(async () => {
              const result = await createQuickCategory(newCategoryName);
              if (result.error || !result.category) {
                setCategoryError(result.error ?? "無法新增分類，請稍後再試。");
                return;
              }
              setAvailableCategories((current) => [...current, result.category]);
              setCategoryId(result.category.id);
              dialogRef.current?.close();
            });
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="quick-category-title" className="text-xl font-bold">新增用途分類</h2>
              <p className="mt-1 text-sm text-muted-foreground">只需輸入名稱，系統會產生安全且唯一的網址代稱。</p>
            </div>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="關閉" onClick={() => dialogRef.current?.close()}>
              <XIcon />
            </Button>
          </div>
          <Field className="mt-5">
            <FieldLabel htmlFor="quick-category-name">分類名稱</FieldLabel>
            <Input
              id="quick-category-name"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              minLength={2}
              maxLength={80}
              autoFocus
              required
            />
          </Field>
          {categoryError ? <p className="mt-3 text-sm text-destructive" role="alert">{categoryError}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()}>取消</Button>
            <Button type="submit" disabled={categoryPending}>{categoryPending ? "新增中…" : "新增並選取"}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
