const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Keep http(s), mailto, tel, and same-site paths. Drop javascript:, data:,
 * protocol-relative URLs, and anything that cannot be parsed.
 */
export function safeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
      return "";
    }
    if (/[\s\\<>"'`]/.test(trimmed)) {
      return "";
    }
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "";
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return "";
  }

  return trimmed;
}
