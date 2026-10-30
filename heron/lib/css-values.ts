const COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d\s,.%/]+\)$|^hsla?\([\d\s,.%/]+\)$/;

/** Hex, rgb()/rgba(), or hsl()/hsla() only. Named colors and CSS breakouts are dropped. */
export function safeColor(val: string): string | null {
  const trimmed = val.trim();
  return COLOR_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * A URL safe to place inside `url(...)`. Rejects quotes, parentheses, and
 * whitespace so the value cannot escape the CSS function.
 */
export function safeCssUrl(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed || trimmed.startsWith("//")) {
    return null;
  }
  if (!/^(?:https?:\/\/|\/)[^\s"'()<>\\]+$/.test(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("/\\") || trimmed.startsWith("//")) {
    return null;
  }
  return trimmed;
}
