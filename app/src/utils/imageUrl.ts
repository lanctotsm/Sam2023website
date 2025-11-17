const CDN_BASE_URL = process.env.REACT_APP_PHOTO_CDN_URL;

function normalizeBaseUrl(base?: string): string | undefined {
  if (!base) {
    return undefined;
  }

  return base.replace(/\/$/, '');
}

export function buildImageUrl(key?: string | null): string | undefined {
  if (!key) {
    return undefined;
  }

  if (key.startsWith('http')) {
    return key;
  }

  const base = normalizeBaseUrl(CDN_BASE_URL);
  if (!base) {
    return undefined;
  }

  return `${base}/${key.replace(/^\/+/, '')}`;
}
