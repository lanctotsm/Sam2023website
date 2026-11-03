export const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp|bmp)$/i;

function parsePositiveBytes(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Max file size for uploads. The server reads MAX_UPLOAD_BYTES, falling back
 * to NEXT_PUBLIC_MAX_UPLOAD_BYTES. Browsers only see NEXT_PUBLIC_* values
 * (inlined at build time), so set both to the same number to raise the limit
 * in the admin UI as well as on the server; otherwise the UI keeps the 25MB
 * default.
 */
export const MAX_UPLOAD_BYTES =
  parsePositiveBytes(process.env.MAX_UPLOAD_BYTES) ??
  parsePositiveBytes(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES) ??
  DEFAULT_MAX_UPLOAD_BYTES;
