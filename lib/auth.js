// Minimal single-admin auth: a shared password (ADMIN_PASSWORD) is exchanged
// for a signed, HTTP-only session cookie. Signing uses Web Crypto HMAC so the
// same code runs in Node route handlers and (if ever needed) edge middleware.

const encoder = new TextEncoder();

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export const SESSION_COOKIE = "tsr_admin";

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(new Uint8Array(sig));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !input) return false;
  return timingSafeEqual(String(input), String(expected));
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

// token = "<expiresAt>.<hmac(expiresAt)>"
export async function signSession() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  const exp = String(Date.now() + SESSION_TTL_MS);
  const sig = await hmac(secret, exp);
  return `${exp}.${sig}`;
}

export async function verifySession(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = await hmac(secret, exp);
  return timingSafeEqual(sig, expected);
}
