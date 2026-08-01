/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ]
  }
};

module.exports = nextConfig;
