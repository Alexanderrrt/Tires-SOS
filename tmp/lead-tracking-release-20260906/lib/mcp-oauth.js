import { signJson, verifyJson } from "./chat-session";

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.MCP_API_KEY || "";
}

export function oauthConfigured() {
  return Boolean(secret());
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(new Uint8Array(digest)).toString("base64url");
}

export function verifyPassword(candidate) {
  const expected = secret();
  return Boolean(expected) && candidate === expected;
}

export async function issueAuthorizationCode({ redirectUri, codeChallenge }) {
  const issuedAt = Date.now();
  return signJson(secret(), {
    t: "code",
    redirectUri,
    codeChallenge,
    exp: issuedAt + CODE_TTL_MS,
  });
}

export async function consumeAuthorizationCode({ code, redirectUri, codeVerifier }) {
  const payload = await verifyJson(secret(), code, { maxLength: 4096 });
  if (!payload || payload.t !== "code") return false;
  if (!Number.isFinite(payload.exp) || payload.exp <= Date.now()) return false;
  if (payload.redirectUri !== redirectUri) return false;
  const derived = await sha256Base64Url(codeVerifier || "");
  return derived === payload.codeChallenge;
}

export async function issueAccessToken() {
  const issuedAt = Date.now();
  const token = await signJson(secret(), { t: "access", exp: issuedAt + TOKEN_TTL_MS });
  return { token, expiresIn: Math.floor(TOKEN_TTL_MS / 1000) };
}

export async function verifyAccessToken(token) {
  const payload = await verifyJson(secret(), token, { maxLength: 4096 });
  return Boolean(payload) && payload.t === "access" && Number.isFinite(payload.exp) && payload.exp > Date.now();
}
