import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { clientAddress, isCrossSiteMutation } from "@/lib/request-guards";

const WINDOW_MS = 60_000;
const AUTH_POST_LIMIT = 30;
const SEARCH_GET_LIMIT = 60;

export function proxy(request: NextRequest) {
  if (isCrossSiteMutation(request)) {
    return NextResponse.json({ error: "cross-site request rejected" }, { status: 403 });
  }

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const address = clientAddress(request);

  if (method === "POST" && pathname.startsWith("/api/auth/")) {
    if (!rateLimit(`auth:${address}`, AUTH_POST_LIMIT, WINDOW_MS)) {
      return NextResponse.json({ error: "too many requests" }, { status: 429 });
    }
  }

  if (method === "GET" && pathname === "/api/search") {
    if (!rateLimit(`search:${address}`, SEARCH_GET_LIMIT, WINDOW_MS)) {
      return NextResponse.json({ error: "too many requests" }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
