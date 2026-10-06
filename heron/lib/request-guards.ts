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

  try {
    return new URL(origin).origin !== requestUrl.origin;
  } catch {
    return true;
  }
}
