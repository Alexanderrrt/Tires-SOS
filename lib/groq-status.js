// Tracks Groq API health/rate-limit state so the admin panel can show it
// without spamming Groq. Every real chat call updates this from the response
// headers Groq already sends; the admin panel just reads the latest snapshot.
// In-memory only — resets per server instance/restart, same tradeoff as the
// rest of this app's non-Supabase dev fallbacks.

let state = {
  status: "unknown", // "ok" | "rate_limited" | "error" | "unknown"
  checkedAt: null,
  limitRequests: null,
  remainingRequests: null,
  resetRequests: null, // raw Groq duration string, e.g. "7m12s"
  limitTokens: null,
  remainingTokens: null,
  resetTokens: null,
  retryAfterSeconds: null,
  message: null,
};

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function headerValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  return headers[name] ?? null;
}

export function recordGroqResponse(headers, { ok, status, message } = {}) {
  const retryAfter = num(headerValue(headers, "retry-after"));
  state = {
    status: ok ? "ok" : status === 429 ? "rate_limited" : "error",
    checkedAt: Date.now(),
    limitRequests: num(headerValue(headers, "x-ratelimit-limit-requests")) ?? state.limitRequests,
    remainingRequests: num(headerValue(headers, "x-ratelimit-remaining-requests")) ?? (ok ? state.remainingRequests : null),
    resetRequests: headerValue(headers, "x-ratelimit-reset-requests") ?? state.resetRequests,
    limitTokens: num(headerValue(headers, "x-ratelimit-limit-tokens")) ?? state.limitTokens,
    remainingTokens: num(headerValue(headers, "x-ratelimit-remaining-tokens")) ?? (ok ? state.remainingTokens : null),
    resetTokens: headerValue(headers, "x-ratelimit-reset-tokens") ?? state.resetTokens,
    retryAfterSeconds: status === 429 ? retryAfter : null,
    message: message || null,
  };
}

export function recordGroqError(message) {
  state = {
    ...state,
    status: "error",
    checkedAt: Date.now(),
    retryAfterSeconds: null,
    message: message || "Request failed.",
  };
}

export function getGroqStatus() {
  return { ...state };
}
