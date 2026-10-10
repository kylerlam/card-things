import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  downloadLinks,
  tags,
  tools,
  toolTags,
} from "@/db/schema";

export type CatalogueTool = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  status: "draft" | "published";
  platforms: string[];
  version: string | null;
  installation: string | null;
  sourceLicense: string | null;
  officialUrl: string | null;
  episodeUrl: string | null;
  tags: Array<{ id: string; name: string; slug: string }>;
};

export type CatalogueToolDetail = CatalogueTool & {
  downloadLinks: Array<{
    id: string;
    label: string;
    provider: string;
    kind: "official" | "mirror";
    platform: string | null;
    url: string;
  }>;
};

function parsePlatforms(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function attachTags(
  rows: Array<{
    id: string;
    slug: string;
    name: string;
    summary: string;
    description: string;
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    status: "draft" | "published";
    platforms: string;
    version: string | null;
    installation: string | null;
    sourceLicense: string | null;
    officialUrl: string | null;
    episodeUrl: string | null;
  }>,
): CatalogueTool[] {
  if (!rows.length) return [];

  const tagRows = db
    .select({
      toolId: toolTags.toolId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(toolTags)
    .innerJoin(tags, eq(toolTags.tagId, tags.id))
    .where(inArray(toolTags.toolId, rows.map((row) => row.id)))
    .orderBy(asc(tags.name))
    .all();

  const tagsByTool = new Map<string, CatalogueTool["tags"]>();
  for (const tag of tagRows) {
    const current = tagsByTool.get(tag.toolId) ?? [];
    current.push({ id: tag.id, name: tag.name, slug: tag.slug });
    tagsByTool.set(tag.toolId, current);
  }

  return rows.map((row) => ({
    ...row,
    platforms: parsePlatforms(row.platforms),
    tags: tagsByTool.get(row.id) ?? [],
  }));
}

function baseToolQuery() {
  return db
    .select({
      id: tools.id,
      slug: tools.slug,
      name: tools.name,
      summary: tools.summary,
      description: tools.description,
      categoryId: tools.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      status: tools.status,
      platforms: tools.platforms,
      version: tools.version,
      installation: tools.installation,
      sourceLicense: tools.sourceLicense,
      officialUrl: tools.officialUrl,
      episodeUrl: tools.episodeUrl,
    })
    .from(tools)
    .innerJoin(categories, eq(tools.categoryId, categories.id));
}

export function listPublishedTools() {
  const rows = baseToolQuery()
    .where(eq(tools.status, "published"))
    .orderBy(asc(categories.sortOrder), asc(tools.name))
    .all();
  return attachTags(rows);
}

export function listAdminTools() {
  const rows = baseToolQuery()
    .orderBy(asc(categories.sortOrder), asc(tools.name))
    .all();
  return attachTags(rows);
}

export function getPublishedToolBySlug(slug: string) {
  const row = baseToolQuery()
    .where(and(eq(tools.slug, slug), eq(tools.status, "published")))
    .get();
  if (!row) return null;
  return attachDownloadLinks(attachTags([row])[0]);
}

export function getAdminTool(id: string) {
  const row = baseToolQuery().where(eq(tools.id, id)).get();
  if (!row) return null;
  return attachDownloadLinks(attachTags([row])[0]);
}

function attachDownloadLinks(tool: CatalogueTool): CatalogueToolDetail {
  const links = db
    .select({
      id: downloadLinks.id,
      label: downloadLinks.label,
      provider: downloadLinks.provider,
      kind: downloadLinks.kind,
      platform: downloadLinks.platform,
      url: downloadLinks.url,
    })
    .from(downloadLinks)
    .where(eq(downloadLinks.toolId, tool.id))
    .orderBy(asc(downloadLinks.sortOrder))
    .all();
  return { ...tool, downloadLinks: links };
}

export function listCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .all();
}

export function listTags() {
  return db.select().from(tags).orderBy(asc(tags.name)).all();
}
