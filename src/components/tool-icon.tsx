"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppWindowIcon } from "lucide-react";

export function ToolIcon({ name, officialUrl }: { name: string; officialUrl: string | null }) {
  const [sources, setSources] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!officialUrl) return;
    const controller = new AbortController();
    fetch(`/api/tool-icon?url=${encodeURIComponent(officialUrl)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((result: { sources: string[] }) => setSources(result.sources))
      .catch(() => {});
    return () => controller.abort();
  }, [officialUrl]);

  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/10 bg-secondary p-1.5 text-secondary-foreground">
      {sources[index] ? (
        <Image
          src={sources[index]}
          alt={`${name} 圖示`}
          width={48}
          height={48}
          unoptimized
          referrerPolicy="no-referrer"
          className="size-full object-contain"
          onError={() => setIndex((current) => current + 1)}
        />
      ) : (
        <AppWindowIcon aria-label={`${name} 圖示暫不可用`} className="size-6" />
      )}
    </div>
  );
}
