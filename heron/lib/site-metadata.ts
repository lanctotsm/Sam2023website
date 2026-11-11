import type { Metadata } from "next";

export const SITE_NAME = "Samuel Lanctot";
export const DEFAULT_SITE_TITLE = `${SITE_NAME} — Software Engineer & Photographer`;
export const SITE_DESCRIPTION =
  "Software engineering, photography, and projects by Samuel Lanctot, a senior software engineer based in Silver Spring, Maryland.";
export const SOCIAL_IMAGE = {
  url: "/social-image",
  width: 1200,
  height: 630,
  alt: "Samuel Lanctot — Software Engineer & Photographer"
};

export function siteUrl(): string {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/+$/, "");
}

const ELLIPSIS = "…";
// Punctuation and dashes that read badly when left dangling before the ellipsis.
const TRAILING_NOISE = /[\s,.;:!?\-–—]+$/;

/**
 * Collapses whitespace and shortens text to fit search and link-preview limits.
 * Cuts at a word boundary when one fits, so the result never ends mid-word.
 */
export function metaDescription(text: string, maxLength = 160): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;

  const budget = Math.max(0, maxLength - ELLIPSIS.length);
  const boundary = collapsed.lastIndexOf(" ", budget);
  const wordCut = boundary > 0 ? collapsed.slice(0, boundary).replace(TRAILING_NOISE, "") : "";
  // A single unbroken word has no boundary to use, so cut it at the limit.
  const cut = wordCut || collapsed.slice(0, budget).trimEnd();
  return cut + ELLIPSIS;
}

/** Explicit nested metadata keeps page overrides from dropping the sharing image. */
export function publicPageMetadata({ title, description, path, image, type = "website" }: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const url = new URL(path, `${siteUrl()}/`).toString();
  const shortDescription = metaDescription(description);
  return {
    title,
    description: shortDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: shortDescription,
      url,
      siteName: SITE_NAME,
      type,
      images: [image ? { url: image } : SOCIAL_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: shortDescription,
      images: [image || SOCIAL_IMAGE.url]
    }
  };
}
