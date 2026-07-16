import { recordGroqResponse, recordGroqError } from "./groq-status";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export function groqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/**
 * Shared Groq chat-completions caller. Used by the on-site chatbot and by
 * server-side jobs (e.g. the Yelp lead auto-responder) that need an LLM
 * reply without duplicating the fetch/timeout/error-tracking plumbing.
 */
export async function callGroqChat(
  messages,
  { withTools, forceTool, tools, toolChoiceName, maxTokens, temperature, timeoutMs = 15_000 } = {},
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: "provider_not_configured" };

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
        model: DEFAULT_MODEL,
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
    if (!response.ok) return { error: "provider_unavailable" };
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

export function groqReplyText(result) {
  const content = result?.body?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}
