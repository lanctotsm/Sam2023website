export const POST_SEO_META_KEYS = [
  "seo_title",
  "seo_description",
  "og_image",
  "og_title",
  "og_description",
  "author",
  "canonical_url",
  "twitter_card",
  "keywords",
  "robots"
] as const;

export const POST_SEO_META_KEY_SET = new Set<string>(POST_SEO_META_KEYS);
