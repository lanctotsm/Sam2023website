function getImageBase(): string {
  return process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";
}

export function buildImageUrl(s3Key: string): string {
  const base = getImageBase();
  if (!base) {
    return s3Key;
  }
  return `${base.replace(/\/$/, "")}/${s3Key.replace(/^\//, "")}`;
}

export type ImageWithKeys = {
  s3_key: string;
  s3_key_thumb?: string | null;
  s3_key_large?: string | null;
  s3_key_original?: string | null;
};

export function buildThumbUrl(image: ImageWithKeys): string {
  const key = image.s3_key_thumb ?? image.s3_key;
  return buildImageUrl(key);
}

export function buildLargeUrl(image: ImageWithKeys): string {
  const key = image.s3_key_large ?? image.s3_key;
  return buildImageUrl(key);
}

export function buildOriginalUrl(image: ImageWithKeys): string {
  const key = image.s3_key_original ?? image.s3_key;
  return buildImageUrl(key);
}
