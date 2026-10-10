"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartIcon, PlusIcon, UserRoundIcon, WrenchIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addDemoCustomTool,
  removeDemoCustomTool,
  signOutDemoUser,
  toggleDemoFavorite,
  updateDemoProfile,
  useDemoUser,
} from "@/lib/demo-user-store";
import { cn } from "@/lib/utils";

type View = "overview" | "favorites" | "custom" | "profile";

const views: Array<{ id: View; label: string }> = [
  { id: "overview", label: "總覽" },
  { id: "favorites", label: "我的收藏" },
  { id: "custom", label: "自訂添加" },
  { id: "profile", label: "個人資料管理" },
];

export function DemoUserWorkspace({ initialView }: { initialView: View }) {
  const router = useRouter();
  const user = useDemoUser();
  const [view, setView] = useState<View>(initialView);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [status, setStatus] = useState("體驗資料只保存在目前瀏覽器工作階段。");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleHistoryChange = () => {
      const requested = new URLSearchParams(window.location.search).get("view");
      setView(views.some((item) => item.id === requested) ? (requested as View) : "overview");
    };
    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, []);

  if (!user.signedIn) {
    return (
      <section className="wire-panel mx-auto max-w-2xl p-8 text-center">
        <h2 className="text-2xl font-bold">請先進入體驗模式</h2>
        <p className="mt-3 text-muted-foreground">這個私人空間只在目前瀏覽器工作階段顯示，不建立真實帳戶。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/auth?next=/user" className={cn(buttonVariants())}>登入體驗</Link>
          <Link href="/auth?register=1&next=/user" className={cn(buttonVariants({ variant: "outline" }))}>註冊流程</Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>返回首頁</Link>
        </div>
      </section>
    );
  }

  function selectView(nextView: View) {
    setView(nextView);
    window.history.pushState(null, "", nextView === "overview" ? "/user" : `/user?view=${nextView}`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel self-start bg-card p-5">
        <h2 className="mb-3 text-xl font-bold">我的空間</h2>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="普通用戶導覽">
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
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              signOutDemoUser();
              router.push(user.entry === "demo" ? "/demo" : "/auth?logout=1");
            }}
          >
            退出體驗模式
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        {view === "overview" ? (
          <section className="wire-panel p-5 sm:p-6">
            <h2 className="text-2xl font-bold">歡迎回來，{user.name}</h2>
            <p className="mt-2 text-muted-foreground">公開工具在首頁瀏覽；收藏與自訂內容集中在這個私人空間。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button type="button" className="wire-panel p-5 text-left" onClick={() => selectView("favorites")}>
                <HeartIcon className="mb-5 size-5" />
                <strong className="block text-3xl">{user.favorites.length}</strong>
                <span className="text-sm text-muted-foreground">已收藏工具</span>
              </button>
              <button type="button" className="wire-panel p-5 text-left" onClick={() => selectView("custom")}>
                <WrenchIcon className="mb-5 size-5" />
                <strong className="block text-3xl">{user.customTools.length}</strong>
                <span className="text-sm text-muted-foreground">自訂添加 · 僅自己可見</span>
              </button>
              <button type="button" className="wire-panel p-5 text-left" onClick={() => selectView("profile")}>
                <UserRoundIcon className="mb-5 size-5" />
                <strong className="block text-lg">{user.id}</strong>
                <span className="text-sm text-muted-foreground">個人資料</span>
              </button>
            </div>
          </section>
        ) : null}

        {view === "favorites" ? (
          <section className="wire-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">我的收藏</h2>
                <p className="mt-2 text-sm text-muted-foreground">從首頁工具卡片的愛心加入。</p>
              </div>
              <Link href="/#catalogue" className={cn(buttonVariants({ variant: "outline" }))}>去首頁找工具</Link>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {user.favorites.length ? user.favorites.map((favorite) => (
                <div key={favorite.slug} className="soft-surface grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <Link href={`/tools/${favorite.slug}`} className="font-bold underline-offset-4 hover:underline">{favorite.name}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">{favorite.summary}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => toggleDemoFavorite(favorite)}>移除收藏</Button>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">尚未收藏；可從首頁工具卡片的 ♡ 開始。</div>
              )}
            </div>
          </section>
        ) : null}

        {view === "custom" ? (
          <section className="wire-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">自訂添加</h2>
                <p className="mt-2 text-sm text-muted-foreground">這些條目不會進入公開工具列表，也不會送到伺服器。</p>
              </div>
              <Button type="button" onClick={() => setShowCustomForm(true)}>
                <PlusIcon data-icon="inline-start" />添加工具
              </Button>
            </div>
            {showCustomForm ? (
              <form
                className="mt-5 rounded-lg border border-border bg-muted p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  addDemoCustomTool(String(form.get("name") ?? ""), String(form.get("note") ?? ""));
                  event.currentTarget.reset();
                  setShowCustomForm(false);
                  setStatus("已加入私人示意列表。");
                }}
              >
                <label htmlFor="custom-name" className="mb-2 block font-semibold">工具名稱</label>
                <Input id="custom-name" name="name" required maxLength={60} autoFocus placeholder="例如：我的常用工具" />
                <label htmlFor="custom-note" className="mt-4 mb-2 block font-semibold">用途備註（選填）</label>
                <Textarea id="custom-note" name="note" rows={3} maxLength={240} placeholder="想用它做什麼？" />
                <div className="mt-4 flex gap-2">
                  <Button type="submit">存入此原型</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCustomForm(false)}>取消</Button>
                </div>
              </form>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              {user.customTools.length ? user.customTools.map((tool) => (
                <div key={tool.id} className="soft-surface flex flex-wrap items-center justify-between gap-3 p-4">
                  <div><strong className="block">{tool.name}</strong><span className="text-sm text-muted-foreground">{tool.note || "沒有備註"}</span></div>
                  <Button type="button" variant="outline" onClick={() => removeDemoCustomTool(tool.id)}>移除</Button>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">尚無自訂條目</div>
              )}
            </div>
          </section>
        ) : null}

        {view === "profile" ? (
          <section className="wire-panel p-5 sm:p-6">
            <h2 className="text-2xl font-bold">個人資料管理</h2>
            <p className="mt-2 text-muted-foreground">用戶 ID 由註冊流程自動分配；其他資料只在本次 Demo 工作階段更新。</p>
            <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <button
                  type="button"
                  className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted p-4 text-center"
                  onClick={() => fileInput.current?.click()}
                >
                  {user.avatar ? (
                    <span className="relative size-full">
                      <Image src={user.avatar} alt="頭像預覽" fill unoptimized className="object-cover" />
                    </span>
                  ) : <span><UserRoundIcon className="mx-auto mb-3 size-12" />點選上傳頭像<br /><small className="text-muted-foreground">本機預覽</small></span>}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/") || file.size > 1_000_000) {
                      setStatus("請選擇 1 MB 以下的圖片檔案。");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      updateDemoProfile({ name: user.name, email: user.email, avatar: String(reader.result) });
                      setStatus("頭像已在本次 Demo 工作階段中預覽。");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const password = String(form.get("password") ?? "");
                  updateDemoProfile({ name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") });
                  const passwordInput = event.currentTarget.elements.namedItem("password");
                  if (passwordInput instanceof HTMLInputElement) passwordInput.value = "";
                  setStatus(password ? "用戶名與郵箱已更新；密碼只通過示意檢查，沒有保存。" : "個人資料已更新於本次 Demo 工作階段。");
                }}
                className="grid gap-4"
              >
                <div><label htmlFor="profile-id" className="mb-2 block font-semibold">用戶唯一 ID</label><Input id="profile-id" value={user.id} disabled /><span className="text-xs text-muted-foreground">系統分配，不可修改</span></div>
                <div><label htmlFor="profile-name" className="mb-2 block font-semibold">用戶名</label><Input id="profile-name" name="name" defaultValue={user.name} maxLength={60} required /></div>
                <div><label htmlFor="profile-email" className="mb-2 block font-semibold">電子郵件</label><Input id="profile-email" name="email" type="email" defaultValue={user.email} required /></div>
                <div><label htmlFor="profile-password" className="mb-2 block font-semibold">修改密碼</label><Input id="profile-password" name="password" type="password" minLength={8} placeholder="不修改請留空" /><span className="text-xs text-muted-foreground">密碼不會保存</span></div>
                <Button type="submit" className="w-fit">儲存資料 · 示意</Button>
              </form>
            </div>
          </section>
        ) : null}

        <div className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm" role="status" aria-live="polite">{status}</div>
      </div>
    </div>
  );
}
