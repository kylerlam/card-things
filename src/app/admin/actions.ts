"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import {
  categories,
  downloadLinks,
  tags,
  tools,
  toolTags,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(240).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
});

const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(60),
  slug,
});

const httpUrl = z.url().refine(
    (value) => !value || value.startsWith("https://") || value.startsWith("http://"),
    "Only HTTP(S) URLs are supported.",
  );

const optionalUrl = z
  .union([z.literal(""), httpUrl])
  .transform((value) => value || null);

const toolSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  slug,
  summary: z.string().trim().min(10).max(220),
  description: z.string().trim().min(20).max(4_000),
  categoryId: z.string().min(1),
  status: z.enum(["draft", "published"]),
  platforms: z.string().trim().max(300),
  version: z.string().trim().max(80).optional(),
  installation: z.string().trim().max(2_000).optional(),
  sourceLicense: z.string().trim().max(200).optional(),
  officialUrl: optionalUrl,
  episodeUrl: optionalUrl,
});

function requiredString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const parsed = categorySchema.parse({
    id: requiredString(formData, "id") || undefined,
    name: requiredString(formData, "name"),
    slug: requiredString(formData, "slug"),
    description: requiredString(formData, "description") || undefined,
    sortOrder: requiredString(formData, "sortOrder"),
  });
  const values = {
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description ?? null,
    sortOrder: parsed.sortOrder,
    updatedAt: new Date(),
  };

  if (parsed.id) {
    db.update(categories).set(values).where(eq(categories.id, parsed.id)).run();
  } else {
    db.insert(categories).values({ id: randomUUID(), ...values }).run();
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function saveTag(formData: FormData) {
  await requireAdmin();
  const parsed = tagSchema.parse({
    id: requiredString(formData, "id") || undefined,
    name: requiredString(formData, "name"),
    slug: requiredString(formData, "slug"),
  });
  const values = {
    name: parsed.name,
    slug: parsed.slug,
    updatedAt: new Date(),
  };

  if (parsed.id) {
    db.update(tags).set(values).where(eq(tags.id, parsed.id)).run();
  } else {
    db.insert(tags).values({ id: randomUUID(), ...values }).run();
  }
  revalidatePath("/");
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTag(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  db.delete(tags).where(eq(tags.id, id)).run();
  revalidatePath("/");
  revalidatePath("/admin/tags");
}

function parseLinks(formData: FormData) {
  const labels = formData.getAll("sourceLabel").map(String);
  const providers = formData.getAll("sourceProvider").map(String);
  const kinds = formData.getAll("sourceKind").map(String);
  const platforms = formData.getAll("sourcePlatform").map(String);
  const urls = formData.getAll("sourceUrl").map(String);

  return labels.flatMap((label, index) => {
    const url = urls[index]?.trim();
    if (!label.trim() && !url) return [];
    return [
      {
        id: randomUUID(),
        label: z.string().trim().min(2).max(100).parse(label),
        provider: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .parse(providers[index] ?? ""),
        kind: z.enum(["official", "mirror"]).parse(kinds[index]),
        platform: z
          .string()
          .trim()
          .max(80)
          .transform((value) => value || null)
          .parse(platforms[index] ?? ""),
        url: httpUrl.parse(url),
        sortOrder: (index + 1) * 10,
      },
    ];
  });
}

export async function saveTool(formData: FormData) {
  await requireAdmin();
  const parsed = toolSchema.parse({
    id: requiredString(formData, "id") || undefined,
    name: requiredString(formData, "name"),
    slug: requiredString(formData, "slug"),
    summary: requiredString(formData, "summary"),
    description: requiredString(formData, "description"),
    categoryId: requiredString(formData, "categoryId"),
    status: requiredString(formData, "status"),
    platforms: requiredString(formData, "platforms"),
    version: requiredString(formData, "version") || undefined,
    installation: requiredString(formData, "installation") || undefined,
    sourceLicense: requiredString(formData, "sourceLicense") || undefined,
    officialUrl: requiredString(formData, "officialUrl"),
    episodeUrl: requiredString(formData, "episodeUrl"),
  });
  const id = parsed.id ?? randomUUID();
  const selectedTagIds = formData.getAll("tagId").map(String);
  const links = parseLinks(formData);
  const platforms = [
    ...new Set(
      parsed.platforms
        .split(",")
        .map((platform) => platform.trim())
        .filter(Boolean),
    ),
  ];
  const values = {
    name: parsed.name,
    slug: parsed.slug,
    summary: parsed.summary,
    description: parsed.description,
    categoryId: parsed.categoryId,
    status: parsed.status,
    platforms: JSON.stringify(platforms),
    version: parsed.version ?? null,
    installation: parsed.installation ?? null,
    sourceLicense: parsed.sourceLicense ?? null,
    officialUrl: parsed.officialUrl,
    episodeUrl: parsed.episodeUrl,
    updatedAt: new Date(),
  };

  db.transaction((tx) => {
    if (parsed.id) {
      tx.update(tools).set(values).where(eq(tools.id, id)).run();
      tx.delete(toolTags).where(eq(toolTags.toolId, id)).run();
      tx.delete(downloadLinks).where(eq(downloadLinks.toolId, id)).run();
    } else {
      tx.insert(tools).values({ id, ...values }).run();
    }

    if (selectedTagIds.length) {
      tx.insert(toolTags)
        .values(selectedTagIds.map((tagId) => ({ toolId: id, tagId })))
        .run();
    }
    if (links.length) {
      tx.insert(downloadLinks)
        .values(links.map((link) => ({ ...link, toolId: id })))
        .run();
    }
  });

  revalidatePath("/");
  revalidatePath(`/tools/${parsed.slug}`);
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function deleteTool(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const existing = db
    .select({ slug: tools.slug })
    .from(tools)
    .where(eq(tools.id, id))
    .get();
  db.delete(tools).where(eq(tools.id, id)).run();
  revalidatePath("/");
  revalidatePath("/admin/tools");
  if (existing) revalidatePath(`/tools/${existing.slug}`);
}
