"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="wire-panel p-6 sm:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const result = await authClient.signIn.email({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          rememberMe: true,
        });
        if (result.error) {
          setPending(false);
          setError("登入失敗，請檢查電子郵件與密碼。");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">電子郵件</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">密碼</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={12}
            required
          />
          <FieldDescription>管理員帳號只能透過本機建立指令新增。</FieldDescription>
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "正在登入…" : "登入"}
        </Button>
      </FieldGroup>
    </form>
  );
}
