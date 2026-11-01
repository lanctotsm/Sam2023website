import { revalidateTag } from "next/cache";

/** Tag on the public post and album `use cache` reads. */
export const PUBLIC_CONTENT_TAG = "public-content";

function isMissingCacheStore(err: unknown): boolean {
  return err instanceof Error && err.message.includes("static generation store missing");
}

/** Expire cached public post and album reads. The next request fills them again. */
export function revalidatePublicContent(): void {
  try {
    revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
  } catch (err) {
    if (isMissingCacheStore(err)) return;
    console.error("Failed to revalidate public content:", err);
  }
}
