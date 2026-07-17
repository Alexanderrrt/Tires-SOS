import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import { getGroqStatus, recordGroqResponse, recordGroqError } from "../../../../lib/groq-status";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

// A minimal, cheap live ping (max_tokens: 1) so the admin panel can refresh
// the real rate-limit numbers on demand instead of waiting for a customer
// chat to happen.
async function pingGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "ping" }], max_tokens: 1 }),
      cache: "no-store",
      signal: controller.signal,
    });
    recordGroqResponse(response.headers, {
      ok: response.ok,
      status: response.status,
      message: response.ok ? null : `HTTP ${response.status}`,
    });
  } catch (error) {
    recordGroqError(error?.name === "AbortError" ? "Ping timed out." : error?.message || "Ping failed.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request) {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (refresh) await pingGroq();

  return Response.json({
    configured: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    ...getGroqStatus(),
  });
}
