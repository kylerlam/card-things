"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminUserEditor } from "@/components/admin-user-editor";

type AdminUser = {
  publicId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
};

export function AdminUserList({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const filtered = useMemo(
    () => users.filter((user) => [user.publicId, user.name, user.email].some((value) => value.toLocaleLowerCase().includes(deferredQuery))),
    [deferredQuery, users],
  );

  return (
    <>
      <label htmlFor="admin-user-search" className="mt-5 mb-2 block font-semibold">搜尋用戶</label>
      <Input
        id="admin-user-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="輸入 ID、用戶名或郵箱"
      />
      <p className="mt-2 text-sm text-muted-foreground" role="status">顯示 {filtered.length} / {users.length} 個伺服器帳戶</p>
      <div className="mt-4 flex flex-col gap-2">
        {filtered.length ? filtered.map((user) => (
          <div key={user.publicId} className="soft-surface min-w-0 p-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="break-all">{user.name}</strong>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "管理員" : "一般用戶"}</Badge>
                  <Badge variant="outline">{user.emailVerified ? "郵箱已驗證" : "郵箱未驗證"}</Badge>
                </div>
                <p className="mt-1 break-all text-sm text-muted-foreground"><span className="select-none">{user.publicId}</span> · {user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <span className="text-xs text-muted-foreground">建立於 {user.createdAt}</span>
                {user.role === "user" ? <Button type="button" variant="outline" onClick={() => setEditingId(editingId === user.publicId ? null : user.publicId)} aria-expanded={editingId === user.publicId} aria-label={`編輯 ${user.name}`}>編輯</Button> : null}
              </div>
            </div>
            {editingId === user.publicId ? <AdminUserEditor user={user} onClose={() => setEditingId(null)} /> : null}
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">沒有符合條件的伺服器帳戶。</div>
        )}
      </div>
    </>
  );
}
