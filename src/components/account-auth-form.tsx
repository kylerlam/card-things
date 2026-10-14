"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

export function AccountAuthForm({
  initialMode,
  nextPath,
}: {
  initialMode: Mode;
  nextPath: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
  }

  return (
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
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");

          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim().toLowerCase();
          const password = String(form.get("password") ?? "");

          if (mode === "register") {
            const confirmation = String(form.get("confirmation") ?? "");
            if (password !== confirmation) {
              setPending(false);
              setError("兩次輸入的密碼不一致。");
              return;
            }

            const result = await authClient.signUp.email({
              name: String(form.get("name") ?? "").trim(),
              email,
              password,
            });
            if (result.error) {
              setPending(false);
              setError("註冊失敗。請確認資料，或改用既有帳戶登入。");
              return;
            }
          } else {
            const result = await authClient.signIn.email({
              email,
              password,
              rememberMe: true,
            });
            if (result.error) {
              setPending(false);
              setError("登入失敗，請檢查電子郵件與密碼。");
              return;
            }
          }

          router.push(nextPath);
          router.refresh();
        }}
      >
        <FieldGroup>
          {mode === "register" ? (
            <Field>
              <FieldLabel htmlFor="account-name">用戶名</FieldLabel>
              <Input
                id="account-name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={60}
                required
              />
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="account-email">電子郵件</FieldLabel>
            <Input
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="account-password">密碼</FieldLabel>
            <Input
              id="account-password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={12}
              maxLength={128}
              required
            />
            <FieldDescription>密碼至少 12 個字元。</FieldDescription>
          </Field>
          {mode === "register" ? (
            <Field>
              <FieldLabel htmlFor="account-confirmation">再次輸入密碼</FieldLabel>
              <Input
                id="account-confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </Field>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "處理中…" : mode === "login" ? "登入" : "建立帳戶"}
          </Button>
        </FieldGroup>
      </form>
    </section>
  );
}
