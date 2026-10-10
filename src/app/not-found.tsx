import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-24 text-center">
        <h1 className="text-4xl font-extrabold">找不到這個工具</h1>
        <p className="mt-3 text-muted-foreground">它可能仍是草稿，或已被移除。</p>
        <Link href="/" className={cn(buttonVariants(), "mt-6")}>
          返回工具列表
        </Link>
      </main>
    </>
  );
}
