"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useDemoUser } from "@/lib/demo-user-store";
import { cn } from "@/lib/utils";

export function DemoAccountNav() {
  const user = useDemoUser();

  return (
    <Link
      href={user.signedIn ? "/user" : "/auth"}
      className={cn(buttonVariants({ variant: "outline" }), "px-2 sm:px-4")}
    >
      {user.signedIn ? "我的空間" : "登入 / 註冊"}
    </Link>
  );
}
