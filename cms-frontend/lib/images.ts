const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

export function buildImageUrl(s3Key: string): string {
  if (!IMAGE_BASE) {
    return s3Key;
  }
  return `${IMAGE_BASE.replace(/\/$/, "")}/${s3Key.replace(/^\//, "")}`;
}
