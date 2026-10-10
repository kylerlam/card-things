"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
  createdAt: string;
};

export function AdminUserList({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const filtered = useMemo(
    () => users.filter((user) => [user.id, user.name, user.email].some((value) => value.toLocaleLowerCase().includes(deferredQuery))),
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
          <div key={user.id} className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{user.name}</strong>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "管理員" : "一般用戶"}</Badge>
                <Badge variant="outline">{user.emailVerified ? "郵箱已驗證" : "郵箱未驗證"}</Badge>
              </div>
              <p className="mt-1 break-all text-sm text-muted-foreground">{user.id} · {user.email}</p>
            </div>
            <span className="text-xs text-muted-foreground">建立於 {user.createdAt}</span>
          </div>
        )) : (
          <div className="border border-dashed border-border p-10 text-center text-muted-foreground">沒有符合條件的伺服器帳戶。</div>
        )}
      </div>
    </>
  );
}
