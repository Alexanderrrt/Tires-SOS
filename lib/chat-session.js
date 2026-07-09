const encoder = new TextEncoder();

const CHAT_SESSION_TTL_MS = 1000 * 60 * 60 * 4;
const TOKEN_VERSION = 1;

export const CHAT_SESSION_COOKIE = "tsr_chat";

function sessionSecret() {
  return process.env.CHAT_SESSION_SECRET || process.env.AUTH_SECRET || "";
}

export function chatSessionConfigured() {
  return Boolean(sessionSecret());
}

export function turnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeB64url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return b64url(new Uint8Array(signature));
}

function timingSafeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function issueChatSession({ challengeVerified = false } = {}) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Chat sessions are not configured.");

  const issuedAt = Date.now();
  const payload = {
    v: TOKEN_VERSION,
    id: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + CHAT_SESSION_TTL_MS,
    challenge: Boolean(challengeVerified),
  };
  const encodedPayload = b64url(JSON.stringify(payload));
  const signature = await hmac(secret, encodedPayload);
  return { token: `${encodedPayload}.${signature}`, session: payload };
}

export async function verifyChatSession(token) {
  const secret = sessionSecret();
  if (!secret || typeof token !== "string" || token.length > 2048) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const expected = await hmac(secret, parts[0]);
  if (!timingSafeEqual(parts[1], expected)) return null;

  let payload;
  try {
    payload = JSON.parse(decodeB64url(parts[0]));
  } catch {
    return null;
  }

  const now = Date.now();
  if (
    payload?.v !== TOKEN_VERSION ||
    typeof payload.id !== "string" ||
    payload.id.length < 16 ||
    payload.id.length > 120 ||
    !Number.isFinite(payload.iat) ||
    !Number.isFinite(payload.exp) ||
    payload.iat > now + 60_000 ||
    payload.exp <= now ||
    payload.exp - payload.iat > CHAT_SESSION_TTL_MS
  ) {
    return null;
  }

  return {
    id: payload.id,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
    challengeVerified: payload.challenge === true,
  };
}

export function chatSessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  };
}

function requestTimeoutMs() {
  const configured = Number(process.env.CHAT_REQUEST_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return 15_000;
  return Math.min(30_000, Math.max(3_000, Math.floor(configured)));
}

export async function verifyTurnstileToken(token, remoteIp = "") {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, required: false };
  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return { ok: false, required: true, reason: "missing" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(requestTimeoutMs(), 7_000));
  try {
    const form = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp && remoteIp !== "unknown") form.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, required: true, reason: "unavailable" };

    const result = await response.json().catch(() => null);
    return result?.success === true
      ? { ok: true, required: true }
      : { ok: false, required: true, reason: "invalid" };
  } catch (error) {
    return {
      ok: false,
      required: true,
      reason: error?.name === "AbortError" ? "timeout" : "unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}
