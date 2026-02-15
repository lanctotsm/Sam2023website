import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    googleId: text("google_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    googleIdIdx: uniqueIndex("idx_users_google_id").on(table.googleId),
    emailIdx: uniqueIndex("idx_users_email").on(table.email)
  })
);

export const oauthStates = sqliteTable("oauth_states", {
  state: text("state").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    tokenIdx: uniqueIndex("idx_sessions_token").on(table.token)
  })
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    markdown: text("markdown").notNull(),
    status: text("status").notNull().default("draft"),
    publishedAt: text("published_at"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_posts_slug").on(table.slug),
    createdByIdx: index("idx_posts_created_by").on(table.createdBy)
  })
);

export const albums = sqliteTable(
  "albums",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_albums_slug").on(table.slug),
    createdByIdx: index("idx_albums_created_by").on(table.createdBy)
  })
);

export const images = sqliteTable(
  "images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    s3Key: text("s3_key").notNull(),
    width: integer("width"),
    height: integer("height"),
    caption: text("caption"),
    altText: text("alt_text"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    s3KeyIdx: uniqueIndex("idx_images_s3_key").on(table.s3Key),
    createdByIdx: index("idx_images_created_by").on(table.createdBy)
  })
);

export const albumImages = sqliteTable(
  "album_images",
  {
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    imageId: integer("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.albumId, table.imageId] })
  })
);

export const postAlbumLinks = sqliteTable(
  "post_album_links",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.albumId] })
  })
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    isBaseAdmin: integer("is_base_admin", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    emailIdx: uniqueIndex("idx_admin_users_email").on(table.email),
    baseAdminIdx: index("idx_admin_users_base_admin").on(table.isBaseAdmin)
  })
);
