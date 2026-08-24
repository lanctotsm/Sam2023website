export type PublicPostVisibility = {
  status: string;
  publishedAt?: string | null;
};

export function isPubliclyVisible(
  post: PublicPostVisibility,
  now: Date = new Date()
): boolean {
  if (post.status !== "published") {
    return false;
  }
  if (post.publishedAt == null || post.publishedAt === "") {
    return true;
  }
  return post.publishedAt <= now.toISOString();
}
