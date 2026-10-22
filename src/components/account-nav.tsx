"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRoundIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  if (pathname === "/auth") return null;

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
        href="/auth"
        aria-label={`我的帳戶：${session.user.name}`}
        title={session.user.name}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "overflow-hidden rounded-full p-0 text-sm font-bold",
        )}
      >
        {session.user.image ? <Image src={session.user.image} alt={`${session.user.name} 的頭像`} width={36} height={36} unoptimized className="size-full object-cover" /> : session.user.name.trim().slice(0, 1).toUpperCase() || <UserRoundIcon />}
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      className={cn(buttonVariants({ variant: "outline" }), "px-2 sm:px-4")}
    >
      登入
    </Link>
  );
}
