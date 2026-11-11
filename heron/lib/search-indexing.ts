/**
 * Album detail pages hold personal photos, so crawlers are kept out of them.
 * The /albums index stays crawlable. robots.txt and the sitemap both read this
 * flag, so flipping it lists album pages and lifts the robots rule together.
 */
export const INDEX_ALBUM_PAGES = false;
