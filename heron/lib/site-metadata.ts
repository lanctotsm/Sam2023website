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

/** Explicit nested metadata keeps page overrides from dropping the sharing image. */
export function publicPageMetadata({ title, description, path, image, type = "website" }: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const url = new URL(path, `${siteUrl()}/`).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [image ? { url: image } : SOCIAL_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || SOCIAL_IMAGE.url]
    }
  };
}
