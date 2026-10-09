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

import { saveTool } from "@/app/admin/actions";

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
  const selectedTags = new Set(tool?.tags.map((tag) => tag.id));

  return (
    <form action={saveTool} className="wire-panel p-5">
      <input type="hidden" name="id" value={tool?.id ?? ""} />
      <div className="mb-5">
        <h2 className="text-2xl font-bold">{tool ? `編輯 ${tool.name}` : "新增工具"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          安裝檔保留在外部來源；此處只管理介紹文字與連結。
        </p>
      </div>

      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tool-name">工具名稱</FieldLabel>
            <Input id="tool-name" name="name" defaultValue={tool?.name} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="tool-slug">Slug</FieldLabel>
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
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="tool-description">完整介紹</FieldLabel>
          <Textarea
            id="tool-description"
            name="description"
            defaultValue={tool?.description}
            minLength={20}
            maxLength={4000}
            rows={6}
            required
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tool-category">用途分類</FieldLabel>
            <NativeSelect
              id="tool-category"
              name="categoryId"
              defaultValue={tool?.categoryId}
              className="w-full"
              required
            >
              <NativeSelectOption value="">選擇分類</NativeSelectOption>
              {categories.map((category) => (
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

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tool-platforms">平台</FieldLabel>
            <Input
              id="tool-platforms"
              name="platforms"
              defaultValue={tool?.platforms.join(", ")}
              placeholder="macOS, Windows, Android"
            />
            <FieldDescription>以逗號分隔；會用於首頁平台篩選。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="tool-version">版本</FieldLabel>
            <Input id="tool-version" name="version" defaultValue={tool?.version ?? ""} />
          </Field>
        </div>

        <FieldSet>
          <FieldLegend>Tags</FieldLegend>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="tagId"
                  value={tag.id}
                  defaultChecked={selectedTags.has(tag.id)}
                />
                {tag.name}
              </label>
            ))}
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
          <FieldDescription>可連到短影片或其他工具介紹內容。</FieldDescription>
        </Field>

        <FieldSet>
          <FieldLegend>下載來源</FieldLegend>
          <FieldDescription>最多三個來源；每列需同時填寫名稱、提供者與 URL。</FieldDescription>
          <div className="flex flex-col gap-3">
            {sourceRows.map((source, index) => (
              <div key={index} className="grid gap-3 border border-border bg-card p-3 lg:grid-cols-5">
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
                  placeholder="平台"
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

        <Button type="submit">{tool ? "儲存工具" : "建立工具"}</Button>
      </FieldGroup>
    </form>
  );
}
