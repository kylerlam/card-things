"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundIcon } from "lucide-react";

import { AvatarEditor } from "@/components/avatar-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type View = "overview" | "profile";

export function UserAccount({
  initialView,
  user,
}: {
  initialView: View;
  user: { publicId: string; name: string; email: string; image: string | null; role?: string | null };
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  function selectView(nextView: View) {
    setView(nextView);
    window.history.pushState(null, "", nextView === "overview" ? "/user" : "/user?view=profile");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="wire-panel self-start bg-card p-5">
        <h2 className="mb-3 text-xl font-bold">我的帳戶</h2>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="用戶導覽">
          <Button
            type="button"
            variant={view === "overview" ? "default" : "outline"}
            className="shrink-0 justify-start"
            aria-current={view === "overview" ? "page" : undefined}
            onClick={() => selectView("overview")}
          >
            總覽
          </Button>
          <Button
            type="button"
            variant={view === "profile" ? "default" : "outline"}
            className="shrink-0 justify-start"
            aria-current={view === "profile" ? "page" : undefined}
            onClick={() => selectView("profile")}
          >
            個人資料管理
          </Button>
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            登出
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        {view === "overview" ? (
          <section className="wire-panel p-5 sm:p-6">
            <h2 className="text-2xl font-bold">歡迎回來，{name}</h2>
            <p className="mt-2 text-muted-foreground">
              這是你的真實 CardThings 帳戶。收藏功能目前暫緩，公開卡片可從首頁瀏覽。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/#catalogue" className={cn(buttonVariants(), "h-auto justify-start p-5")}>瀏覽公開卡片</Link>
              <button
                type="button"
                className="wire-panel p-5 text-left"
                onClick={() => selectView("profile")}
              >
                <UserRoundIcon className="mb-4 size-5" />
                <strong className="block">管理個人資料</strong>
                <span className="text-sm text-muted-foreground">更新頭像、名稱或密碼</span>
              </button>
            </div>
          </section>
        ) : null}

        {view === "profile" ? (
          <section className="wire-panel p-5 sm:p-6">
            <h2 className="text-2xl font-bold">個人資料管理</h2>
            <p className="mt-2 text-muted-foreground">帳戶資料與密碼會安全地寫入伺服器資料庫。</p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="soft-surface p-4">
                <dt className="text-sm text-muted-foreground">用戶 ID</dt>
                <dd className="mt-2 font-semibold">{user.publicId}</dd>
              </div>
              <div className="soft-surface p-4">
                <dt className="text-sm text-muted-foreground">電子郵件</dt>
                <dd className="mt-2 break-all font-semibold">{user.email}</dd>
              </div>
            </dl>

            <div className="mt-6"><AvatarEditor image={user.image} name={name} /></div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <form
                className="soft-surface p-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setPending(true);
                  setStatus("");
                  const form = new FormData(event.currentTarget);
                  const nextName = String(form.get("name") ?? "").trim();
                  const result = await authClient.updateUser({ name: nextName });
                  setPending(false);
                  if (result.error) {
                    setStatus(result.error.code === "USERNAME_TAKEN"
                      ? "這個用戶名已被使用，請換一個。"
                      : "無法更新用戶名，請稍後再試。");
                    return;
                  }
                  setName(nextName);
                  setStatus("用戶名已更新。");
                  router.refresh();
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-name">用戶名</FieldLabel>
                    <Input
                      id="profile-name"
                      name="name"
                      defaultValue={name}
                      minLength={2}
                      maxLength={60}
                      required
                    />
                  </Field>
                  <Button type="submit" disabled={pending}>儲存用戶名</Button>
                </FieldGroup>
              </form>

              <form
                className="soft-surface p-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setPending(true);
                  setStatus("");
                  const form = new FormData(event.currentTarget);
                  const newPassword = String(form.get("newPassword") ?? "");
                  if (newPassword !== String(form.get("confirmation") ?? "")) {
                    setPending(false);
                    setStatus("兩次輸入的新密碼不一致。");
                    return;
                  }
                  const result = await authClient.changePassword({
                    currentPassword: String(form.get("currentPassword") ?? ""),
                    newPassword,
                    revokeOtherSessions: true,
                  });
                  setPending(false);
                  if (result.error) {
                    setStatus("無法更新密碼，請確認目前密碼。");
                    return;
                  }
                  event.currentTarget.reset();
                  setStatus("密碼已更新，其他登入階段已登出。");
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current-password">目前密碼</FieldLabel>
                    <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new-password">新密碼</FieldLabel>
                    <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
                    <FieldDescription>密碼至少 12 個字元。</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password-confirmation">再次輸入新密碼</FieldLabel>
                    <Input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
                  </Field>
                  <Button type="submit" disabled={pending}>更新密碼</Button>
                </FieldGroup>
              </form>
            </div>
            {status ? (
              <div className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm" role="status" aria-live="polite">
                {status}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
