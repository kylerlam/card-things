"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", label: "總覽", exact: true },
  { href: "/admin/users", label: "用戶管理" },
  { href: "/admin/tools", label: "工具管理" },
  { href: "/admin/categories", label: "用途分類管理" },
  { href: "/admin/tags", label: "Tag 管理" },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="管理員導覽">
      {navigation.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: active ? "default" : "outline" }),
              "shrink-0 justify-start",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/admin/profile"
        className={cn(
          buttonVariants({ variant: pathname === "/admin/profile" ? "default" : "outline" }),
          "shrink-0 justify-start lg:hidden",
        )}
        aria-current={pathname === "/admin/profile" ? "page" : undefined}
      >
        個人資料
      </Link>
      <div className="hidden border-t border-border pt-3 lg:block">
        <p className="mb-2 text-sm font-semibold">個人空間</p>
        <Link
          href="/admin/profile"
          className={cn(
            buttonVariants({ variant: pathname === "/admin/profile" ? "default" : "outline" }),
            "w-full justify-start",
          )}
          aria-current={pathname === "/admin/profile" ? "page" : undefined}
        >
          個人資料管理
        </Link>
      </div>
    </nav>
  );
}
