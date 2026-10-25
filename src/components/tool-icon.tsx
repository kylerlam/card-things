"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function ToolIcon({ name, imageUrl, officialUrl }: { name: string; imageUrl?: string | null; officialUrl: string | null }) {
  const [resolved, setResolved] = useState<{ url: string; sources: string[] } | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const sources = imageUrl ? [imageUrl] : resolved?.url === officialUrl ? resolved.sources : [];
  const source = sources.find((url) => !failedSources.includes(url));

  useEffect(() => {
    if (imageUrl || !officialUrl) return;
    const controller = new AbortController();
    fetch(`/api/tool-icon?url=${encodeURIComponent(officialUrl)}`, { signal: controller.signal, cache: "no-cache" })
      .then((response) => response.json())
      .then((result: { sources: string[] }) => setResolved({ url: officialUrl, sources: result.sources }))
      .catch(() => {});
    return () => controller.abort();
  }, [imageUrl, officialUrl]);

  return (
    <div className="grid size-[3.6rem] shrink-0 place-items-center rounded-lg border border-primary/10 bg-secondary p-[0.1875rem] text-secondary-foreground">
      <div className={`grid size-full place-items-center overflow-hidden border-2 border-white ${imageUrl ? "rounded-md" : "rounded-full"}`}>
        {source ? (
          <Image
            src={source}
            alt={`${name} ${imageUrl ? "圖片" : "圖示"}`}
            width={48}
            height={48}
            unoptimized
            referrerPolicy="no-referrer"
            className="size-full object-contain"
            onError={() => setFailedSources((current) => [...current, source])}
          />
        ) : (
          <svg
            viewBox="0 0 40 40"
            role="img"
            aria-label={`${name} 預設圖示`}
            className="size-full"
          >
            <rect x="5" y="9" width="24" height="27" rx="5" transform="rotate(-10 17 22.5)" fill="currentColor" opacity="0.16" />
            <rect x="10" y="5" width="25" height="29" rx="5" fill="var(--card)" stroke="currentColor" strokeWidth="1.8" />
            <rect x="15" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
            <rect x="24" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.35" />
            <rect x="15" y="20" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.35" />
            <circle cx="27" cy="23" r="3" fill="currentColor" />
          </svg>
        )}
      </div>
    </div>
  );
}
