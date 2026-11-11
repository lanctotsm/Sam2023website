import type { MetadataRoute } from "next";
import { INDEX_ALBUM_PAGES } from "@/lib/search-indexing";
import { siteUrl } from "@/lib/site-metadata";

const PRIVATE_PATHS = ["/admin", "/api", "/upload"];
// The trailing slash keeps the /albums index crawlable while hiding album detail pages.
const ALBUM_DETAIL_PATHS = ["/albums/"];

export default function robots(): MetadataRoute.Robots {
  const disallow = INDEX_ALBUM_PAGES
    ? PRIVATE_PATHS
    : [...PRIVATE_PATHS, ...ALBUM_DETAIL_PATHS];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow
    },
    sitemap: `${siteUrl()}/sitemap.xml`
  };
}
