import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isE2ETestMode } from "./runtime-mode";

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_SECONDS = 300;
const MEMORY_ENTRY_LIMIT = 20_000;
const RPC_NAME = "consume_chat_rate_limit";

const memoryState = globalThis.__tiresSosChatRateLimit || {
  entries: new Map(),
  operations: 0,
  warnedAboutRpc: false,
};
globalThis.__tiresSosChatRateLimit = memoryState;

function noStoreFetch(input, init = {}) {
  return fetch(input, { ...init, cache: "no-store" });
}

function boundedEnvInt(name, fallback, minimum, maximum) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function policy() {
  const sessionMax = boundedEnvInt("CHAT_RATE_LIMIT_MAX", DEFAULT_MAX, 2, 500);
  const windowSeconds = boundedEnvInt(
    "CHAT_RATE_LIMIT_WINDOW_SECONDS",
    DEFAULT_WINDOW_SECONDS,
    10,
    86_400,
  );
  return {
    session: { limit: sessionMax, windowSeconds },
    ip: { limit: Math.max(40, sessionMax * 4), windowSeconds },
    sessionIssue: { limit: Math.max(20, sessionMax * 2), windowSeconds },
  };
}

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^\uFEFF/, "").replace(/^\u00ef\u00bb\u00bf/, "");
}

function supabaseConfigured() {
  return !isE2ETestMode() && Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseClient() {
  return createClient(
    cleanEnv(process.env.SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false }, global: { fetch: noStoreFetch } },
  );
}

function hashKey(scope, value) {
  return createHash("sha256").update(`${scope}:${value}`).digest("hex");
}

function pruneMemory(now) {
  memoryState.operations += 1;
  if (memoryState.operations % 100 !== 0 && memoryState.entries.size < MEMORY_ENTRY_LIMIT) return;

  for (const [key, entry] of memoryState.entries) {
    if (entry.resetAt <= now) memoryState.entries.delete(key);
  }
  while (memoryState.entries.size > MEMORY_ENTRY_LIMIT) {
    const oldest = memoryState.entries.keys().next().value;
    if (!oldest) break;
    memoryState.entries.delete(oldest);
  }
}

function consumeMemory(key, limit, windowSeconds) {
  const now = Date.now();
  pruneMemory(now);
  const current = memoryState.entries.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowSeconds * 1000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  memoryState.entries.delete(key);
  memoryState.entries.set(key, entry);

  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    backend: "memory",
  };
}

function parseRpcResult(data, limit) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean") return null;
  const resetAt = new Date(row.reset_at || row.resetAt).getTime();
  return {
    allowed: row.allowed,
    limit,
    remaining: Number.isFinite(Number(row.remaining)) ? Math.max(0, Number(row.remaining)) : 0,
    resetAt: Number.isFinite(resetAt) ? resetAt : Date.now() + 60_000,
    backend: "supabase",
  };
}

async function consume(scope, value, { limit, windowSeconds }) {
  const key = hashKey(scope, value || "unknown");
  if (supabaseConfigured()) {
    try {
      const { data, error } = await supabaseClient().rpc(RPC_NAME, {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });
      if (!error) {
        const parsed = parseRpcResult(data, limit);
        if (parsed) return parsed;
      }
      if (!memoryState.warnedAboutRpc) {
        memoryState.warnedAboutRpc = true;
        console.warn("Distributed chat rate limiting is unavailable; using the in-memory fallback.");
      }
    } catch {
      if (!memoryState.warnedAboutRpc) {
        memoryState.warnedAboutRpc = true;
        console.warn("Distributed chat rate limiting is unavailable; using the in-memory fallback.");
      }
    }
  }
  return consumeMemory(key, limit, windowSeconds);
}

export function getClientIp(request) {
  const direct = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const value = (direct || forwarded || "unknown").trim().slice(0, 120);
  return value || "unknown";
}

export async function checkChatRateLimits({ ip, sessionId }) {
  const limits = policy();
  const [ipResult, sessionResult] = await Promise.all([
    consume("chat-ip", ip, limits.ip),
    consume("chat-session", sessionId, limits.session),
  ]);
  const blocked = [ipResult, sessionResult].filter((result) => !result.allowed);
  const retryAt = blocked.length
    ? Math.max(...blocked.map((result) => result.resetAt))
    : Math.min(ipResult.resetAt, sessionResult.resetAt);

  return {
    allowed: blocked.length === 0,
    limit: sessionResult.limit,
    remaining: Math.min(ipResult.remaining, sessionResult.remaining),
    resetAt: retryAt,
    retryAfter: Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)),
    scope: !sessionResult.allowed ? "session" : !ipResult.allowed ? "ip" : null,
    backend: ipResult.backend === "supabase" && sessionResult.backend === "supabase" ? "supabase" : "memory",
  };
}

export async function checkSessionIssueRateLimit(ip) {
  const result = await consume("chat-session-issue", ip, policy().sessionIssue);
  return {
    ...result,
    retryAfter: Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}
