/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Origins the browser legitimately talks to, grouped so the CSP below stays
// readable. Server-only hosts (Groq, Gmail, Google Ads API, Supabase) are
// intentionally absent — they are never contacted from the browser.
const CLERK = "https://*.clerk.accounts.dev https://clerk-telemetry.com";
const POSTHOG = "https://us.i.posthog.com https://us-assets.i.posthog.com https://us.posthog.com";
const TURNSTILE = "https://challenges.cloudflare.com";
const GOOGLE_TAG = "https://www.googletagmanager.com";
const GOOGLE_CONN =
  "https://www.google-analytics.com https://region1.google-analytics.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net";
const GOOGLE_MAPS = "https://www.google.com"; // maps embed iframe

// Full Content-Security-Policy (production only). 'unsafe-inline' is required
// for scripts because Next.js emits inline bootstrap scripts and the app uses
// inline gtag config / JSON-LD without nonces; a nonce-based policy would be a
// larger, separate change. Everything else is locked to the specific origins
// inventoried above.
const contentSecurityPolicyProd = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' ${CLERK} ${TURNSTILE} ${GOOGLE_TAG} https://us-assets.i.posthog.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self'",
  "worker-src 'self' blob:",
  `connect-src 'self' ${CLERK} ${POSTHOG} ${TURNSTILE} ${GOOGLE_TAG} ${GOOGLE_CONN} ${GOOGLE_MAPS}`,
  `frame-src 'self' ${GOOGLE_MAPS} ${CLERK} ${TURNSTILE} https://td.doubleclick.net`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// In development, next dev's HMR needs eval and websockets, which a strict
// script/connect policy would block. Keep only the framing/base/object
// hardening — those never interfere with local dev.
const contentSecurityPolicyDev = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

// Deny every powerful feature the site does not use. autoplay and fullscreen
// are limited to same-origin so the hero/cinematic videos keep working.
const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=(self)",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "usb=()",
  "browsing-topics=()",
].join(", ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: isProd ? contentSecurityPolicyProd : contentSecurityPolicyDev },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
