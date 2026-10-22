"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarEditor } from "@/components/avatar-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AdminUserEditor({ user, onClose }: {
  user: { publicId: string; name: string; email: string; image: string | null };
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});

  return (
    <section className="mt-4 min-w-0 border-t border-border pt-4" aria-label={`編輯 ${user.name} 的資料`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">編輯用戶資料</h3>
          <p className="mt-1 break-all text-sm text-muted-foreground">用戶 ID：{user.publicId}（不可修改）</p>
          <p className="mt-1 text-sm text-muted-foreground">角色維持一般用戶。更換郵箱或重設密碼後，該用戶需重新登入。</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>關閉編輯</Button>
      </div>
      <AvatarEditor image={user.image} name={user.name} targetPublicId={user.publicId} />
      <form className="mt-5" onSubmit={async (event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const data = new FormData(formElement);
        const password = String(data.get("password") ?? "");
        if (password !== String(data.get("confirmation") ?? "")) {
          setFeedback({ error: "兩次輸入的新密碼不一致。" });
          return;
        }
        setPending(true);
        setFeedback({});
        try {
          const response = await fetch(`/api/admin/users/${user.publicId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.get("name"), email: data.get("email"), ...(password ? { password } : {}) }),
          });
          const result = await response.json();
          setFeedback(response.ok ? { message: result.message } : { error: result.error });
          if (response.ok) {
            (formElement.elements.namedItem("password") as HTMLInputElement).value = "";
            (formElement.elements.namedItem("confirmation") as HTMLInputElement).value = "";
            router.refresh();
          }
        } catch {
          setFeedback({ error: "無法儲存，請確認連線後再試。" });
        } finally {
          setPending(false);
        }
      }}>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`admin-name-${user.publicId}`}>用戶名</FieldLabel>
              <Input id={`admin-name-${user.publicId}`} name="name" defaultValue={user.name} minLength={2} maxLength={60} required />
            </Field>
            <Field>
              <FieldLabel htmlFor={`admin-email-${user.publicId}`}>電子郵件</FieldLabel>
              <Input id={`admin-email-${user.publicId}`} name="email" type="email" defaultValue={user.email} maxLength={254} required />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`admin-password-${user.publicId}`}>新密碼</FieldLabel>
              <Input id={`admin-password-${user.publicId}`} name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
              <FieldDescription>留空保留原密碼；重設時至少 12 個字元。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`admin-confirmation-${user.publicId}`}>再次輸入新密碼</FieldLabel>
              <Input id={`admin-confirmation-${user.publicId}`} name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} />
            </Field>
          </div>
          {feedback.error ? <p role="alert" className="text-sm text-destructive">{feedback.error}</p> : null}
          {feedback.message ? <p role="status" className="text-sm text-muted-foreground">{feedback.message}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "儲存中…" : "儲存用戶資料"}</Button>
        </FieldGroup>
      </form>
    </section>
  );
}
