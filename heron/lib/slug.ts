/**
 * Converts a title to a URL-friendly slug.
 * e.g. "My Cool Post!" -> "my-cool-post"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
