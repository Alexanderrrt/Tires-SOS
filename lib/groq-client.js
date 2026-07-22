import { recordGroqResponse, recordGroqError } from "./groq-status.js";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
// Separate free Groq model with its own rate-limit bucket. If the primary
// model is saturated (429), retrying against this model instead of waiting
// out the reset lets concurrent users still get a reply at no extra cost.
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";

export function groqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

async function postToGroq({ apiKey, model, messages, temperature, maxTokens, withTools, forceTool, tools, toolChoiceName, timeoutMs }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const toolChoice = forceTool && toolChoiceName
      ? { type: "function", function: { name: toolChoiceName } }
      : "auto";
    const response = await fetch(GROQ_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 500,
        ...(withTools && tools ? { tools, tool_choice: toolChoice } : {}),
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    recordGroqResponse(response.headers, {
      ok: response.ok,
      status: response.status,
      message: response.ok ? null : `HTTP ${response.status}`,
    });
    if (!response.ok) return { error: "provider_unavailable", status: response.status };
    const body = await response.json().catch(() => null);
    return { body };
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    recordGroqError(timedOut ? "Request timed out." : error?.message || "Network error.");
    return { error: timedOut ? "provider_timeout" : "provider_unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared Groq chat-completions caller. Used by the on-site chatbot and by
 * server-side jobs (e.g. the Yelp lead auto-responder) that need an LLM
 * reply without duplicating the fetch/timeout/error-tracking plumbing.
 *
 * If the primary model comes back rate-limited (429), this retries once
 * against FALLBACK_MODEL — a different free Groq model with its own
 * rate-limit bucket — so a burst of concurrent users doesn't just fail.
 *
 * Pass backoffMs for callers that aren't latency-sensitive (e.g. a cron job
 * rather than a live chat reply): on a 429 it waits that long and retries
 * the primary model once *before* falling back to FALLBACK_MODEL, since the
 * primary model is usually the better result and the extra wait is free.
 */
export async function callGroqChat(
  messages,
  { withTools, forceTool, tools, toolChoiceName, maxTokens, temperature, timeoutMs = 15_000, backoffMs = 0 } = {},
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: "provider_not_configured" };

  const deadline = Date.now() + timeoutMs;
  const call = (model, budgetMs) =>
    postToGroq({
      apiKey, model, messages, temperature, maxTokens,
      withTools, forceTool, tools, toolChoiceName,
      timeoutMs: Math.max(3_000, Math.min(timeoutMs, budgetMs)),
    });

  let primary = await call(DEFAULT_MODEL, deadline - Date.now());

  if (primary.status === 429 && backoffMs > 0 && deadline - Date.now() > backoffMs + 2_000) {
    await sleep(backoffMs);
    primary = await call(DEFAULT_MODEL, deadline - Date.now());
  }

  const remaining = deadline - Date.now();
  if (primary.status !== 429 || FALLBACK_MODEL === DEFAULT_MODEL || remaining < 2_000) {
    return primary;
  }

  return call(FALLBACK_MODEL, remaining);
}

export function groqReplyText(result) {
  const content = result?.body?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}
