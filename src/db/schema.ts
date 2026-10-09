import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    role: text("role", { enum: ["user", "admin"] })
      .notNull()
      .default("user"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const tools = sqliteTable(
  "tools",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    platforms: text("platforms").notNull().default("[]"),
    version: text("version"),
    installation: text("installation"),
    sourceLicense: text("source_license"),
    officialUrl: text("official_url"),
    episodeUrl: text("episode_url"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("tools_slug_unique").on(table.slug),
    index("tools_category_idx").on(table.categoryId),
    index("tools_status_idx").on(table.status),
  ],
);

export const toolTags = sqliteTable(
  "tool_tags",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.toolId, table.tagId] })],
);

export const downloadLinks = sqliteTable(
  "download_links",
  {
    id: text("id").primaryKey(),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    provider: text("provider").notNull(),
    kind: text("kind", { enum: ["official", "mirror"] })
      .notNull()
      .default("mirror"),
    platform: text("platform"),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("download_links_tool_idx").on(table.toolId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  tools: many(tools),
}));

export const toolRelations = relations(tools, ({ one, many }) => ({
  category: one(categories, {
    fields: [tools.categoryId],
    references: [categories.id],
  }),
  tags: many(toolTags),
  downloadLinks: many(downloadLinks),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  tools: many(toolTags),
}));

export const toolTagRelations = relations(toolTags, ({ one }) => ({
  tool: one(tools, { fields: [toolTags.toolId], references: [tools.id] }),
  tag: one(tags, { fields: [toolTags.tagId], references: [tags.id] }),
}));

export const downloadLinkRelations = relations(downloadLinks, ({ one }) => ({
  tool: one(tools, {
    fields: [downloadLinks.toolId],
    references: [tools.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  categories,
  tags,
  tools,
  toolTags,
  downloadLinks,
  userRelations,
  sessionRelations,
  accountRelations,
  categoryRelations,
  toolRelations,
  tagRelations,
  toolTagRelations,
  downloadLinkRelations,
};
