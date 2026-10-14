"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <Link
      href={session?.user ? "/user" : "/auth"}
      className={cn(buttonVariants({ variant: "outline" }), "px-2 sm:px-4")}
    >
      {isPending ? "帳戶" : session?.user ? "我的帳戶" : "登入 / 註冊"}
    </Link>
  );
}
