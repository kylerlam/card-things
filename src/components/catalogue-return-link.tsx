"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { canReturnToCatalogue, markCatalogueReturn } from "@/lib/catalogue-navigation";
import { cn } from "@/lib/utils";

export function CatalogueReturnLink() {
  const router = useRouter();
  useEffect(() => { markCatalogueReturn(window.location.pathname); }, []);

  return (
    <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "mb-6")} onNavigate={(event) => {
      if (!canReturnToCatalogue()) return;
      event.preventDefault();
      router.back();
    }}>
      <ArrowLeftIcon data-icon="inline-start" />
      返回卡片列表
    </Link>
  );
}
