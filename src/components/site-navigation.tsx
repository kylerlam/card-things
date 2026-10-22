"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { ChevronDownIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { navigateToCatalogue } from "@/lib/catalogue-navigation";
import { cn } from "@/lib/utils";

export function SiteNavigation({ categories }: { categories: Array<{ id: string; name: string; slug: string }> }) {
  const pathname = usePathname();
  const closeReason = useRef("");
  const linkClass = cn(buttonVariants({ variant: "ghost" }), "gap-1 px-1.5 max-[360px]:px-1 max-[360px]:text-xs md:px-3");

  return (
    <div className="col-span-2 row-start-2 flex min-w-0 items-center justify-self-center gap-1 md:col-span-1 md:col-start-2 md:row-start-1" role="group" aria-label="網站選單">
      <Link href="/#top" className={linkClass} aria-current={pathname === "/" ? "page" : undefined}>首頁</Link>
      <Link href="/#catalogue" className={linkClass} onNavigate={() => navigateToCatalogue()}>工具庫</Link>
      <Menu.Root modal={false} onOpenChange={(_, details) => { closeReason.current = details.reason; }}>
        <Menu.Trigger className={linkClass}>
          分類導覽
          <ChevronDownIcon data-icon="inline-end" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="center" sideOffset={8} collisionPadding={16}>
            <Menu.Popup className="wire-panel flex w-56 max-w-[calc(100vw-2rem)] flex-col p-2 outline-none" aria-label="用途分類" finalFocus={() => closeReason.current !== "item-press"}>
              <Menu.Group>
                <Menu.LinkItem closeOnClick render={<Link href="/#catalogue" onNavigate={() => navigateToCatalogue()} />} className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start px-3")}>
                  全部卡片
                </Menu.LinkItem>
                {categories.map((item) => (
                  <Menu.LinkItem
                    key={item.id}
                    closeOnClick
                    render={<Link href={`/?category=${encodeURIComponent(item.slug)}#catalogue`} onNavigate={() => navigateToCatalogue(item.slug)} />}
                    className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start px-3")}
                  >
                    {item.name}
                  </Menu.LinkItem>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Link href="/about" className={linkClass} aria-current={pathname === "/about" ? "page" : undefined}>關於本站</Link>
    </div>
  );
}
