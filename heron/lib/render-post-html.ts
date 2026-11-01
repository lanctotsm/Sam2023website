import { asc, eq } from "drizzle-orm";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { getDb } from "@/lib/db";
import { albumImages, albums, images } from "@/lib/db/schema";
import { isAlbumPubliclyVisible } from "@/lib/album-visibility";
import { buildThumbUrl } from "@/lib/images";

const SHORTCODE_PATTERN = /\[\[(\w+):([\w-]+)\]\]/g;

type HastNode = {
  type: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Allow http(s), mailto, in-page hashes, and site-relative paths. */
export function isSafeRenderedUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return /^(https?:|mailto:)/i.test(trimmed);
  }
  return !trimmed.includes(":");
}

function sanitizeUrls() {
  const walk = (node: HastNode) => {
    const properties = node.properties;
    if (properties) {
      for (const key of ["href", "src"] as const) {
        const value = properties[key];
        if (typeof value === "string" && !isSafeRenderedUrl(value)) {
          delete properties[key];
        }
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  return (tree: HastNode) => {
    walk(tree);
  };
}

const markdownToHtml = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(sanitizeUrls)
  .use(rehypeStringify);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderMarkdown(markdown: string): Promise<string> {
  const file = await markdownToHtml.process(markdown);
  return String(file);
}

async function renderAlbumEmbedHtml(slug: string): Promise<string> {
  const db = getDb();
  const albumRows = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
  const album = albumRows[0];
  if (!album || !isAlbumPubliclyVisible(album)) {
    return `<div class="rounded-xl border border-copper bg-copper/5 p-4 text-center text-copper">[Album not found: ${escapeHtml(slug)}]</div>`;
  }

  const rows = await db
    .select({
      id: images.id,
      s3Key: images.s3Key,
      s3KeyThumb: images.s3KeyThumb,
      s3KeyLarge: images.s3KeyLarge,
      name: images.name,
      caption: images.caption,
      altText: images.altText
    })
    .from(albumImages)
    .innerJoin(images, eq(albumImages.imageId, images.id))
    .where(eq(albumImages.albumId, album.id))
    .orderBy(asc(albumImages.sortOrder), asc(images.id));

  const figures = rows
    .map((row) => {
      const alt = escapeHtml(row.altText || row.caption || row.name || album.title);
      const src = escapeHtml(
        buildThumbUrl({
          s3_key: row.s3Key,
          s3_key_thumb: row.s3KeyThumb,
          s3_key_large: row.s3KeyLarge
        })
      );
      const href = `/albums/${encodeURIComponent(album.slug)}?photo=${row.id}`;
      return `<a href="${href}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></a>`;
    })
    .join("");

  const title = escapeHtml(album.title);
  const albumHref = `/albums/${encodeURIComponent(album.slug)}`;
  return `<div class="my-8"><h3 class="mb-4 text-xl font-semibold"><a href="${albumHref}">${title}</a></h3><div class="grid grid-cols-2 gap-2 sm:grid-cols-3">${figures}</div></div>`;
}

/** Render markdown and album shortcodes to HTML stored on the post. */
export async function renderPostHtml(markdown: string): Promise<string> {
  const parts: string[] = [];
  let lastIndex = 0;
  const shortcodeRegex = new RegExp(SHORTCODE_PATTERN.source, "g");

  let match: RegExpExecArray | null;
  while ((match = shortcodeRegex.exec(markdown)) !== null) {
    const textBefore = markdown.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      parts.push(await renderMarkdown(textBefore));
    }

    const type = match[1];
    const identifier = match[2];
    if (type === "album") {
      parts.push(await renderAlbumEmbedHtml(identifier));
    } else {
      parts.push(
        `<p>[Unknown shortcode: [[${escapeHtml(type)}:${escapeHtml(identifier)}]]]</p>`
      );
    }

    lastIndex = match.index + match[0].length;
  }

  const textAfter = markdown.slice(lastIndex);
  if (textAfter.trim()) {
    parts.push(await renderMarkdown(textAfter));
  }

  return parts.join("\n");
}
