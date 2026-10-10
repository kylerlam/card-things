"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DemoFavorite } from "@/lib/demo-user-store";
import {
  signInDemoUser,
  signOutDemoUser,
  toggleDemoFavorite,
} from "@/lib/demo-user-store";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

function createDemoId() {
  return `CT-DEMO-${String(Math.floor(Math.random() * 10_000)).padStart(4, "0")}`;
}

export function DemoAuthForm({
  initialMode,
  nextPath,
  pendingFavorite,
  loggedOut,
}: {
  initialMode: Mode;
  nextPath: string;
  pendingFavorite: DemoFavorite | null;
  loggedOut: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [issuedCode, setIssuedCode] = useState("");
  const [status, setStatus] = useState(
    loggedOut ? "已退出體驗模式，可重新登入或註冊。" : "可切換登入與註冊，查看完整表單狀態。",
  );

  useEffect(() => {
    if (loggedOut) signOutDemoUser();
  }, [loggedOut]);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setIssuedCode("");
    setStatus(nextMode === "login" ? "輸入任意合規示例資料即可登入體驗。" : "註冊只建立本次瀏覽器工作階段的示例身份。");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
      <section className="wire-panel p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="帳戶表單">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "outline"}
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => selectMode("login")}
          >
            登入
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "outline"}
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => selectMode("register")}
          >
            註冊
          </Button>
          <span className="ml-0 text-sm text-muted-foreground sm:ml-4">
            安全 Demo · 不建立真實帳戶
          </span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "").trim();
            const password = String(form.get("password") ?? "");

            if (mode === "register") {
              const confirmation = String(form.get("confirmation") ?? "");
              const code = String(form.get("code") ?? "");
              if (password !== confirmation) {
                setStatus("兩次輸入的密碼不一致。");
                return;
              }
              if (!issuedCode || code !== issuedCode) {
                setStatus("請輸入本頁顯示的 6 位示意驗證碼。");
                return;
              }
              if (form.get("human") !== "yes") {
                setStatus("請勾選原型人機校驗，再繼續體驗。");
                return;
              }
              signInDemoUser({
                id: createDemoId(),
                name: String(form.get("name") ?? "").trim(),
                email,
              });
            } else {
              signInDemoUser({ email });
            }

            if (pendingFavorite) toggleDemoFavorite(pendingFavorite);
            router.push(nextPath);
          }}
        >
          <FieldGroup>
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="demo-name">用戶名</FieldLabel>
                <Input
                  id="demo-name"
                  name="name"
                  autoComplete="nickname"
                  maxLength={60}
                  placeholder="如何稱呼你"
                  required
                />
                <FieldDescription>完成示意註冊後會自動分配不可修改的用戶 ID。</FieldDescription>
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="demo-email">電子郵件</FieldLabel>
              <Input
                id="demo-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.test"
                required
              />
            </Field>
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="demo-code">郵箱驗證碼</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="demo-code"
                    name="code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="6 位數驗證碼"
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const code = "246810";
                      setIssuedCode(code);
                      setStatus(`示意驗證碼：${code}。沒有發送任何郵件。`);
                    }}
                  >
                    取得示意驗證碼
                  </Button>
                </div>
                <FieldDescription>驗證碼只會顯示在本頁，不會發送郵件。</FieldDescription>
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="demo-password">密碼</FieldLabel>
              <Input
                id="demo-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                placeholder="至少 8 個字元"
                required
              />
            </Field>
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="demo-confirmation">再次輸入密碼</FieldLabel>
                <Input
                  id="demo-confirmation"
                  name="confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="確認密碼"
                  required
                />
              </Field>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              顯示密碼
            </label>
            {mode === "register" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="human" value="yes" />
                我不是機器人（原型勾選示意）
              </label>
            ) : null}
            <Button type="submit">
              {mode === "login" ? "登入體驗" : "註冊並進入體驗"}
            </Button>
            <p className="text-sm text-muted-foreground">
              密碼不會保存；此流程不連接郵件、驗證服務或正式帳戶資料庫。
            </p>
          </FieldGroup>
        </form>

        <div className="mt-5 rounded-lg border border-border bg-muted p-3 text-sm" role="status" aria-live="polite">
          {status}
        </div>
      </section>

      <aside className="wire-panel flex flex-col p-5 sm:p-7">
        <h2 className="text-2xl font-bold">登入後可做什麼</h2>
        <p className="mt-3 leading-7">收藏常用工具、管理僅自己可見的自訂條目，並體驗個人資料頁。</p>
        <div className="my-6 grid min-h-48 place-items-center rounded-lg border border-border bg-muted p-6 text-center text-muted-foreground">
          個人後台預覽區
        </div>
        <Link href="/user" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>查看普通用戶後台</Link>
        <Link href="/admin/login" className="mt-5 text-sm underline underline-offset-4">
          管理員使用安全管理登入
        </Link>
      </aside>
    </div>
  );
}
