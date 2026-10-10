"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteDemoAdminCategory,
  deleteDemoAdminTag,
  deleteDemoAdminTool,
  resetDemoAdmin,
  saveDemoAdminCategory,
  saveDemoAdminTag,
  saveDemoAdminTool,
  signOutDemoAdmin,
  updateDemoAdminProfile,
  useDemoAdmin,
  type DemoAdminCategory,
  type DemoAdminTag,
  type DemoAdminTool,
} from "@/lib/demo-admin-store";
import { cn } from "@/lib/utils";

type View = "overview" | "users" | "tools" | "categories" | "tags" | "profile";

const views: Array<{ id: View; label: string }> = [
  { id: "overview", label: "總覽" },
  { id: "users", label: "用戶管理" },
  { id: "tools", label: "工具管理" },
  { id: "categories", label: "用途分類管理" },
  { id: "tags", label: "Tag 管理" },
];

function viewFromLocation() {
  if (typeof window === "undefined") return "overview" as View;
  const requested = new URLSearchParams(window.location.search).get("view");
  return views.some((item) => item.id === requested) || requested === "profile"
    ? (requested as View)
    : "overview";
}

function freshId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function DemoAdminWorkspace() {
  const router = useRouter();
  const admin = useDemoAdmin();
  const [view, setView] = useState<View>("overview");
  const [status, setStatus] = useState("所有管理操作只改變目前瀏覽器的 Demo 沙盒。");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const syncView = () => setView(viewFromLocation());
    syncView();
    window.addEventListener("popstate", syncView);
    return () => window.removeEventListener("popstate", syncView);
  }, []);

  function selectView(nextView: View) {
    setView(nextView);
    const nextUrl = nextView === "overview" ? "/demo/admin" : `/demo/admin?view=${nextView}`;
    window.history.pushState(null, "", nextUrl);
  }

  if (!admin.signedIn) {
    return (
      <section className="wire-panel mx-auto max-w-2xl p-8 text-center">
        <p className="eyebrow">隔離 Demo · 無伺服器權限</p>
        <h2 className="mt-2 text-2xl font-bold">尚未選擇示例管理員身份</h2>
        <p className="mt-3 text-muted-foreground">請從 Demo 入口進入。這個页面不接受真实管理员凭据。</p>
        <Link href="/demo" className={cn(buttonVariants(), "mt-6")}>返回 Demo 身份選擇</Link>
      </section>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel min-w-0 max-w-full self-start overflow-hidden bg-card p-5">
        <h2 className="mb-1 text-xl font-bold">管理工作區</h2>
        <p className="mb-3 text-xs text-muted-foreground">隔離 Demo · {admin.profile.name}</p>
        <nav className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="Demo 管理員導覽">
          {views.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={view === item.id ? "default" : "outline"}
              className="shrink-0 justify-start"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => selectView(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <div className="hidden border-t border-border pt-3 lg:block">
            <p className="mb-2 text-sm font-semibold">個人空間</p>
            <Button
              type="button"
              variant={view === "profile" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => selectView("profile")}
            >
              個人資料管理
            </Button>
          </div>
          <Button
            type="button"
            variant={view === "profile" ? "default" : "outline"}
            className="shrink-0 justify-start lg:hidden"
            onClick={() => selectView("profile")}
          >
            個人資料
          </Button>
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              signOutDemoAdmin();
              router.push("/demo");
            }}
          >
            退出管理員 Demo
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        {view === "overview" ? (
          <Overview
            toolCount={admin.tools.length}
            publishedCount={admin.tools.filter((tool) => tool.status === "published").length}
            categoryCount={admin.categories.length}
            tagCount={admin.tags.length}
            onSelect={selectView}
          />
        ) : null}
        {view === "users" ? <UsersView /> : null}
        {view === "tools" ? (
          <ToolsView
            tools={admin.tools}
            categories={admin.categories}
            onStatus={setStatus}
          />
        ) : null}
        {view === "categories" ? (
          <CategoriesView
            categories={admin.categories}
            onStatus={setStatus}
          />
        ) : null}
        {view === "tags" ? <TagsView tags={admin.tags} onStatus={setStatus} /> : null}
        {view === "profile" ? (
          <ProfileView
            profile={admin.profile}
            onStatus={setStatus}
          />
        ) : null}

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span role="status" aria-live="polite">{status}</span>
          {confirmReset ? (
            <span className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  resetDemoAdmin();
                  setConfirmReset(false);
                  setStatus("Demo 沙盒已恢复为初始虚构数据。");
                }}
              >
                確認重置
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmReset(false)}>取消</Button>
            </span>
          ) : (
            <Button type="button" variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcwIcon data-icon="inline-start" />重置 Demo 数据
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Overview({
  toolCount,
  publishedCount,
  categoryCount,
  tagCount,
  onSelect,
}: {
  toolCount: number;
  publishedCount: number;
  categoryCount: number;
  tagCount: number;
  onSelect: (view: View) => void;
}) {
  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">管理總覽</h2>
      <p className="mt-2 text-muted-foreground">這是每位訪客獨立的浏览器沙盒，不连接真实数据库。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[[toolCount, "全部工具"], [publishedCount, "已發布"], [categoryCount, "用途分類"], [tagCount, "Tags"]].map(([value, label]) => (
          <div key={label} className="soft-surface p-4">
            <strong className="block text-3xl">{value}</strong><span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="soft-surface p-5">
          <h3 className="text-xl font-bold">用戶管理</h3>
          <p className="mt-2 text-sm text-muted-foreground">查看固定 Demo ID、用戶名与邮箱。</p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => onSelect("users")}>查看用戶</Button>
        </div>
        <div className="soft-surface p-5">
          <h3 className="text-xl font-bold">工具、分類與 Tag</h3>
          <p className="mt-2 text-sm text-muted-foreground">各有独立入口和可操作的沙盒状态。</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onSelect("tools")}>工具</Button>
            <Button type="button" variant="outline" onClick={() => onSelect("categories")}>用途分類</Button>
            <Button type="button" variant="outline" onClick={() => onSelect("tags")}>Tag</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function UsersView() {
  const [query, setQuery] = useState("");
  const users = useMemo(() => [
    { id: "CT-DEMO-0001", name: "示例用戶", email: "demo.user@example.test", role: "普通用戶" },
    { id: "CT-DEMO-ADMIN", name: "示例管理員", email: "demo.admin@example.test", role: "管理員 Demo" },
  ].filter((user) => Object.values(user).some((value) => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [query]);

  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">用戶管理</h2>
      <p className="mt-2 text-sm text-muted-foreground">固定虚构身份仅用于预览，不对应真实服务器账户。</p>
      <label htmlFor="demo-user-search" className="mt-5 mb-2 block font-semibold">搜尋用戶</label>
      <Input id="demo-user-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入 ID、用戶名或郵箱" />
      <div className="mt-4 flex flex-col gap-2">
        {users.length ? users.map((user) => (
          <div key={user.id} className="soft-surface flex flex-wrap items-center justify-between gap-3 p-4">
            <div><strong className="block">{user.name}</strong><span className="text-sm text-muted-foreground">{user.id} · {user.email}</span></div>
            <Badge variant={user.role === "管理員 Demo" ? "default" : "secondary"}>{user.role}</Badge>
          </div>
        )) : <div className="border border-dashed border-border p-10 text-center text-muted-foreground">沒有符合條件的 Demo 用戶。</div>}
      </div>
    </section>
  );
}

function ToolsView({ tools, categories, onStatus }: { tools: DemoAdminTool[]; categories: DemoAdminCategory[]; onStatus: (status: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = tools.find((tool) => tool.id === editingId) ?? null;
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">工具管理</h2>
      <p className="mt-2 text-sm text-muted-foreground">新增、编辑、发布或移除只改变本浏览器 Demo 沙盒。</p>
      <form
        key={editing?.id ?? "new-tool"}
        className="soft-surface mt-5 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          saveDemoAdminTool({
            id: editing?.id ?? freshId("tool"),
            name: String(form.get("name") ?? "").trim(),
            slug: String(form.get("slug") ?? "").trim(),
            summary: String(form.get("summary") ?? "").trim(),
            categoryId: String(form.get("categoryId") ?? ""),
            status: String(form.get("status")) === "published" ? "published" : "draft",
            platforms: String(form.get("platforms") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
            version: String(form.get("version") ?? "").trim(),
            sourceLabel: String(form.get("sourceLabel") ?? "").trim(),
            sourceUrl: String(form.get("sourceUrl") ?? "").trim(),
          });
          event.currentTarget.reset();
          setEditingId(null);
          onStatus(editing ? "工具已更新于 Demo 沙盒。" : "工具已新增至 Demo 沙盒。");
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="工具名稱" id="demo-tool-name"><Input id="demo-tool-name" name="name" defaultValue={editing?.name} required maxLength={100} /></Field>
          <Field label="Slug" id="demo-tool-slug"><Input id="demo-tool-slug" name="slug" defaultValue={editing?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></Field>
          <Field label="用途分類" id="demo-tool-category"><NativeSelect id="demo-tool-category" name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id} className="w-full" required>{categories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}</NativeSelect></Field>
          <Field label="發布狀態" id="demo-tool-status"><NativeSelect id="demo-tool-status" name="status" defaultValue={editing?.status ?? "draft"} className="w-full"><NativeSelectOption value="draft">草稿</NativeSelectOption><NativeSelectOption value="published">已發布</NativeSelectOption></NativeSelect></Field>
          <Field label="平台（逗号分隔）" id="demo-tool-platforms"><Input id="demo-tool-platforms" name="platforms" defaultValue={editing?.platforms.join(", ")} placeholder="macOS, Windows" required /></Field>
          <Field label="版本" id="demo-tool-version"><Input id="demo-tool-version" name="version" defaultValue={editing?.version} /></Field>
          <div className="md:col-span-2"><Field label="摘要" id="demo-tool-summary"><Textarea id="demo-tool-summary" name="summary" defaultValue={editing?.summary} minLength={10} maxLength={220} required /></Field></div>
          <Field label="来源名称" id="demo-tool-source-label"><Input id="demo-tool-source-label" name="sourceLabel" defaultValue={editing?.sourceLabel} placeholder="官方下載頁" /></Field>
          <Field label="外部来源 URL" id="demo-tool-source-url"><Input id="demo-tool-source-url" name="sourceUrl" type="url" defaultValue={editing?.sourceUrl} placeholder="https://example.com/..." /></Field>
        </div>
        <div className="mt-4 flex gap-2"><Button type="submit">{editing ? "儲存工具" : "新增工具"}</Button>{editing ? <Button type="button" variant="outline" onClick={() => setEditingId(null)}>取消編輯</Button> : null}</div>
      </form>
      <div className="mt-5 flex flex-col gap-2">
        {tools.length ? tools.map((tool) => (
          <div key={tool.id} data-testid={`demo-tool-row-${tool.slug}`} className="soft-surface grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><strong>{tool.name}</strong><Badge variant={tool.status === "published" ? "default" : "secondary"}>{tool.status === "published" ? "已發布" : "草稿"}</Badge><Badge variant="outline">{categoryNames.get(tool.categoryId) ?? "未分类"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{tool.summary}</p></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditingId(tool.id)}>編輯</Button><Button type="button" variant="destructive" onClick={() => { deleteDemoAdminTool(tool.id); if (editingId === tool.id) setEditingId(null); onStatus("工具已从 Demo 沙盒移除。"); }}>移除</Button></div>
          </div>
        )) : <div className="border border-dashed border-border p-10 text-center text-muted-foreground">Demo 工具列表为空。</div>}
      </div>
    </section>
  );
}

function CategoriesView({ categories, onStatus }: { categories: DemoAdminCategory[]; onStatus: (status: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = categories.find((category) => category.id === editingId) ?? null;
  return <ManagedList title="用途分類管理" noun="分類" items={categories} editing={editing} onEdit={setEditingId} onSave={(item) => { saveDemoAdminCategory(item); setEditingId(null); onStatus(editing ? "分類已更新于 Demo 沙盒。" : "分類已新增至 Demo 沙盒。"); }} onDelete={(id) => { const deleted = deleteDemoAdminCategory(id); onStatus(deleted ? "分類已从 Demo 沙盒移除。" : "此分類仍被工具使用，无法移除。"); }} />;
}

function TagsView({ tags, onStatus }: { tags: DemoAdminTag[]; onStatus: (status: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = tags.find((tag) => tag.id === editingId) ?? null;
  return <ManagedList title="Tag 管理" noun="Tag" items={tags} editing={editing} onEdit={setEditingId} onSave={(item) => { saveDemoAdminTag(item); setEditingId(null); onStatus(editing ? "Tag 已更新于 Demo 沙盒。" : "Tag 已新增至 Demo 沙盒。"); }} onDelete={(id) => { deleteDemoAdminTag(id); onStatus("Tag 已从 Demo 沙盒移除。"); }} />;
}

function ManagedList<T extends DemoAdminCategory | DemoAdminTag>({ title, noun, items, editing, onEdit, onSave, onDelete }: { title: string; noun: string; items: T[]; editing: T | null; onEdit: (id: string | null) => void; onSave: (item: T) => void; onDelete: (id: string) => void }) {
  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">新增、编辑或移除只改变本浏览器 Demo 沙盒。</p>
      <form key={editing?.id ?? `new-${noun}`} className="soft-surface mt-5 p-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ id: editing?.id ?? freshId(noun === "Tag" ? "tag" : "cat"), name: String(form.get("name") ?? "").trim(), slug: String(form.get("slug") ?? "").trim() } as T); event.currentTarget.reset(); }}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={`${noun}名稱`} id={`demo-${noun}-name`}><Input id={`demo-${noun}-name`} name="name" defaultValue={editing?.name} required /></Field><Field label="Slug" id={`demo-${noun}-slug`}><Input id={`demo-${noun}-slug`} name="slug" defaultValue={editing?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></Field></div>
        <div className="mt-4 flex gap-2"><Button type="submit">{editing ? `儲存${noun}` : `新增${noun}`}</Button>{editing ? <Button type="button" variant="outline" onClick={() => onEdit(null)}>取消編輯</Button> : null}</div>
      </form>
      <div className="mt-5 flex flex-col gap-2">{items.length ? items.map((item) => <div key={item.id} className="soft-surface flex flex-wrap items-center justify-between gap-3 p-4"><div><strong className="block">{item.name}</strong><span className="text-sm text-muted-foreground">{item.slug}</span></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => onEdit(item.id)}>編輯</Button><Button type="button" variant="destructive" onClick={() => onDelete(item.id)}>移除</Button></div></div>) : <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">列表为空。</div>}</div>
    </section>
  );
}

function ProfileView({ profile, onStatus }: { profile: { id: string; name: string; email: string }; onStatus: (status: string) => void }) {
  return (
    <section className="wire-panel p-5 sm:p-6">
      <h2 className="text-2xl font-bold">個人資料管理</h2><p className="mt-2 text-muted-foreground">所有字段都是虚构 Demo 资料，不会修改真实管理员账户。</p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const password = String(form.get("password") ?? ""); updateDemoAdminProfile({ name: String(form.get("name") ?? "").trim(), email: String(form.get("email") ?? "").trim() }); const input = event.currentTarget.elements.namedItem("password"); if (input instanceof HTMLInputElement) input.value = ""; onStatus(password ? "Demo 管理员资料已更新；密码未保存。" : "Demo 管理员资料已更新。"); }}>
        <Field label="用戶唯一 ID" id="demo-admin-id"><Input id="demo-admin-id" value={profile.id} disabled /></Field>
        <Field label="身份" id="demo-admin-role"><Input id="demo-admin-role" value="管理員 Demo（无服务器权限）" disabled /></Field>
        <Field label="用戶名" id="demo-admin-name"><Input id="demo-admin-name" name="name" defaultValue={profile.name} required /></Field>
        <Field label="電子郵件" id="demo-admin-email"><Input id="demo-admin-email" name="email" type="email" defaultValue={profile.email} required /></Field>
        <Field label="修改密碼" id="demo-admin-password"><Input id="demo-admin-password" name="password" type="password" minLength={8} placeholder="不修改請留空" /></Field>
        <div className="flex items-end"><Button type="submit">儲存資料 · Demo</Button></div>
      </form>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="mb-2 block font-semibold">{label}</label>{children}</div>;
}
