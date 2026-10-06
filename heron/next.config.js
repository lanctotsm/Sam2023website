/** @type {import('next').NextConfig} */

function imageRemotePatterns() {
  const patterns = [
    {
      protocol: "https",
      hostname: "www.gstatic.com",
      pathname: "/firebasejs/ui/**"
    }
  ];

  const raw = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!raw) {
    return patterns;
  }

  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") {
      return patterns;
    }
    patterns.push({
      protocol,
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/**"
    });
  } catch {
    // Ignore a malformed image base URL; the optimizer simply will not fetch it.
  }

  return patterns;
}

function imageHostSources() {
  const sources = ["'self'", "data:", "blob:"];
  const raw = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!raw) {
    return sources.join(" ");
  }
  try {
    sources.push(new URL(raw).origin);
  } catch {
    // Same as remotePatterns: a bad base URL is omitted from img-src.
  }
  return sources.join(" ");
}

function securityHeaders() {
  const httpsSite = (process.env.NEXTAUTH_URL || "").startsWith("https://");
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  // The dev server's React refresh runtime evaluates code. Production does not.
  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-eval'");
  }

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageHostSources()}`,
    "font-src 'self'",
    "connect-src 'self'",
    httpsSite ? "upgrade-insecure-requests" : null
  ]
    .filter(Boolean)
    .join("; ");

  const headers = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
  ];

  if (httpsSite) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains"
    });
  }

  return headers;
}

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // sharp needs its platform packages (@img/*) for native image processing;
  // compiled binaries are also required beyond what JS tracing usually picks up.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*"
    ]
  },
  experimental: {
    // No Server Actions currently accept file uploads (uploads go through the
    // app/api/images/upload route handler, which enforces its own
    // MAX_UPLOAD_BYTES), but keep this in sync with that budget in case one
    // is added later. See docs/ARCHITECTURE_PROPOSAL.md.
    serverActions: {
      bodySizeLimit: "25mb"
    }
  },
  images: {
    remotePatterns: imageRemotePatterns()
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders()
      }
    ];
  }
};

module.exports = nextConfig;
