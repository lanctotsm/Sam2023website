const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type GuardRequest = {
  method: string;
  url: string;
  headers: Headers;
  ip?: string | null;
};

/** Last X-Forwarded-For hop is the address appended by the trusted reverse proxy. */
export function clientAddress(request: GuardRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      return last;
    }
  }
  return request.ip || "unknown";
}

/**
 * True when a state-changing /api request declares a foreign Origin or
 * Sec-Fetch-Site: cross-site. Missing headers (non-browser clients) are allowed.
 */
export function isCrossSiteMutation(request: GuardRequest): boolean {
  if (!MUTATING.has(request.method.toUpperCase())) {
    return false;
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return true;
  }

  if (!requestUrl.pathname.startsWith("/api/")) {
    return false;
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const expected = expectedOrigin(request, requestUrl);
  if (!expected) {
    return false;
  }

  try {
    return new URL(origin).origin !== expected;
  } catch {
    return true;
  }
}

/** Public site URL, when configured. TLS often stops at the reverse proxy. */
function canonicalSite(): URL | null {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function sameSiteHost(hostHeader: string, site: URL): boolean {
  try {
    const requestHost = new URL(`http://${hostHeader}`);
    return requestHost.hostname === site.hostname && requestHost.port === site.port;
  } catch {
    return false;
  }
}

/**
 * The origin the browser used. Prefer Host / X-Forwarded-* over request.url,
 * which can be an internal bind address such as 0.0.0.0.
 *
 * Apache terminates TLS and proxies to Node over HTTP, and it does not always
 * set X-Forwarded-Proto. A browser on https://example.com then sends
 * Origin: https://example.com while request.url is http://example.com.
 * When that host is the configured public site, use NEXTAUTH_URL's origin.
 */
function expectedOrigin(request: GuardRequest, requestUrl: URL): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost ? forwardedHost.split(",")[0] : request.headers.get("host"))?.trim();
  if (!host) {
    return requestUrl.origin;
  }

  const site = canonicalSite();
  if (site && sameSiteHost(host, site)) {
    return site.origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || requestUrl.protocol.replace(":", "") || "http";
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return requestUrl.origin;
  }
}
