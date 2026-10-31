import { revalidatePath, revalidateTag } from "next/cache";

/** Tag for the public post and album reads wrapped in unstable_cache. */
export const PUBLIC_CONTENT_TAG = "public-content";

function isMissingCacheStore(err: unknown): boolean {
  return err instanceof Error && err.message.includes("static generation store missing");
}

/**
 * Drop cached public HTML and the cached SQLite reads behind it.
 * Dynamic routes are invalidated by path pattern so a renamed slug is included.
 */
export function revalidatePublicContent(): void {
  try {
    revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/albums");
    revalidatePath("/albums/[slug]", "page");
    revalidatePath("/feed.xml");
    revalidatePath("/sitemap.xml");
  } catch (err) {
    if (isMissingCacheStore(err)) return;
    console.error("Failed to revalidate public content:", err);
  }
}
