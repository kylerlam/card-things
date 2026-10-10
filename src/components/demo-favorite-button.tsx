"use client";

import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DemoFavorite } from "@/lib/demo-user-store";
import { toggleDemoFavorite, useDemoUser } from "@/lib/demo-user-store";

export function DemoFavoriteButton({ favorite }: { favorite: DemoFavorite }) {
  const router = useRouter();
  const user = useDemoUser();
  const saved = user.favorites.some((item) => item.slug === favorite.slug);

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={saved}
      onClick={() => {
        if (!user.signedIn) {
          const params = new URLSearchParams({ favorite: favorite.slug, next: `/tools/${favorite.slug}` });
          router.push(`/auth?${params.toString()}`);
          return;
        }
        toggleDemoFavorite(favorite);
      }}
    >
      <HeartIcon data-icon="inline-start" className={saved ? "fill-current" : undefined} />
      {saved ? "已收藏" : "收藏工具"}
    </Button>
  );
}
