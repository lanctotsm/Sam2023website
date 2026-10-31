import { asc, eq } from "drizzle-orm";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { getDb } from "@/lib/db";
import { albumImages, albums, images } from "@/lib/db/schema";
import { buildThumbUrl } from "@/lib/images";

const SHORTCODE_REGEX = /\[\[(\w+):([\w-]+)\]\]/g;

const markdownToHtml = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
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
  if (!album) {
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
  SHORTCODE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SHORTCODE_REGEX.exec(markdown)) !== null) {
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
