"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function AccountEmailEditor({ email }: { email: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="soft-surface min-w-0 p-4">
      <dt className="text-sm text-muted-foreground">電子郵件</dt>
      <dd className="mt-2">
        <p className="break-all font-semibold">{email}</p>
        {editing ? (
          <form className="mt-4" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setPending(true);
            setError("");
            try {
              const response = await fetch("/api/auth/account-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newEmail: String(form.get("newEmail") ?? "").trim(), currentPassword: String(form.get("currentPassword") ?? "") }),
              });
              const result = await response.json();
              if (!response.ok) {
                setError(response.status === 429 ? "操作過於頻繁，請稍後再試。" : result.message || "無法更新電子郵件，請稍後再試。");
                return;
              }
              await authClient.signOut();
              router.replace("/auth?emailUpdated=1");
              router.refresh();
            } catch {
              setError("無法更新電子郵件，請稍後再試。");
            } finally {
              setPending(false);
            }
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account-email">新電子郵件</FieldLabel>
                <Input id="account-email" name="newEmail" type="email" autoComplete="email" defaultValue={email} maxLength={254} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email-current-password">確認目前密碼</FieldLabel>
                <Input id="email-current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required />
                <FieldDescription>儲存後需使用新電子郵件重新登入。</FieldDescription>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>儲存電子郵件</Button>
                <Button type="button" variant="outline" disabled={pending} onClick={() => { setEditing(false); setError(""); }}>取消</Button>
              </div>
            </FieldGroup>
            {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
          </form>
        ) : (
          <Button type="button" variant="outline" className="mt-3" onClick={() => setEditing(true)}>編輯電子郵件</Button>
        )}
      </dd>
    </div>
  );
}
