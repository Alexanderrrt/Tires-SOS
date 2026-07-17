/** @type {import('next').NextConfig} */

// Security headers applied to every response. Deliberately excludes a script
// Content-Security-Policy: Next.js, Clerk and PostHog rely on inline/eval'd
// bootstrap code, so a strict script CSP would need per-request nonces and is
// left for a separate, tested change. `frame-ancestors 'none'` (plus the legacy
// X-Frame-Options) still blocks clickjacking of /admin and /dashboard.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
