import catalogue from "../../../../deployments/local-preview/catalogue.json";

import { resolveToolIconSources } from "@/lib/tool-icons";

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("url") ?? "";
  const preferred = catalogue.cards.find((card) => card.officialUrl === value)?.iconUrl;
  const sources = preferred
    ? [preferred]
    : value.length <= 2048 ? await resolveToolIconSources(value) : [];
  return Response.json({ sources }, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
