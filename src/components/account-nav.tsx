"use client";

import Link from "next/link";
import { UserRoundIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "rounded-full",
        )}
        aria-label="正在載入帳戶"
      >
        <UserRoundIcon />
      </span>
    );
  }

  if (session?.user) {
    return (
      <Link
        href="/user"
        aria-label={`我的帳戶：${session.user.name}`}
        title={session.user.name}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "rounded-full text-sm font-bold",
        )}
      >
        {session.user.name.trim().slice(0, 1).toUpperCase() || <UserRoundIcon />}
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      className={cn(buttonVariants({ variant: "outline" }), "px-2 sm:px-4")}
    >
      登入 / 註冊
    </Link>
  );
}
