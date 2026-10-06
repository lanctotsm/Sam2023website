const ALLOWED_KEY = /^(uploads|backgrounds|pending)\/[A-Za-z0-9._/-]+$/;

/** Client-supplied object keys must stay inside the prefixes this app writes. */
export function isAllowedObjectKey(key: string): boolean {
  if (!key || key.includes("..") || key.includes("\\") || key.includes("\0")) {
    return false;
  }
  return ALLOWED_KEY.test(key);
}
