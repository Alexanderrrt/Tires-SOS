import { NextResponse } from "next/server";
import {
  CHAT_SESSION_COOKIE,
  chatSessionConfigured,
  chatSessionCookieOptions,
  issueChatSession,
  turnstileConfigured,
  verifyChatSession,
  verifyTurnstileToken,
} from "../../../../lib/chat-session";
import { checkSessionIssueRateLimit, getClientIp } from "../../../../lib/chat-rate-limit";

export const dynamic = "force-dynamic";

const MAX_SESSION_BODY_BYTES = 8192;

function json(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function validForCurrentChallenge(session) {
  return Boolean(session && (!turnstileConfigured() || session.challengeVerified));
}

async function currentSession(request) {
  const token = request.cookies.get(CHAT_SESSION_COOKIE)?.value;
  return verifyChatSession(token);
}

function successBody(session) {
  return {
    ok: true,
    sessionId: session.id,
    expiresAt: session.expiresAt,
    turnstileRequired: false,
  };
}

async function issueResponse({ challengeVerified, ip }) {
  const rate = await checkSessionIssueRateLimit(ip);
  if (!rate.allowed) {
    const response = json(
      {
        ok: false,
        error: "Too many chat sessions were requested. Please wait and try again.",
        code: "rate_limited",
        sessionId: null,
        turnstileRequired: turnstileConfigured(),
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(rate.retryAfter));
    return response;
  }

  const issued = await issueChatSession({ challengeVerified });
  const response = json(successBody({
    id: issued.session.id,
    expiresAt: issued.session.exp,
  }));
  response.cookies.set(
    CHAT_SESSION_COOKIE,
    issued.token,
    chatSessionCookieOptions(issued.session.exp),
  );
  return response;
}

async function readBody(request) {
  const header = request.headers.get("content-length");
  if (header) {
    const length = Number(header);
    if (!Number.isFinite(length) || length < 0) throw Object.assign(new Error("Invalid body length."), { status: 400 });
    if (length > MAX_SESSION_BODY_BYTES) throw Object.assign(new Error("Request body is too large."), { status: 413 });
  }
  if (!request.body) return {};
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_SESSION_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw Object.assign(new Error("Request body is too large."), { status: 413 });
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw Object.assign(new Error("Invalid JSON payload."), { status: 400 });
  }
  if (!text.trim()) return {};
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Bad JSON.");
    return body;
  } catch {
    throw Object.assign(new Error("Invalid JSON payload."), { status: 400 });
  }
}

export async function GET(request) {
  if (!chatSessionConfigured()) {
    return json(
      {
        ok: false,
        error: "Chat is temporarily unavailable.",
        code: "session_not_configured",
        sessionId: null,
        turnstileRequired: false,
      },
      { status: 503 },
    );
  }

  const existing = await currentSession(request);
  if (validForCurrentChallenge(existing)) return json(successBody(existing));

  if (turnstileConfigured()) {
    return json({ ok: false, sessionId: null, turnstileRequired: true });
  }

  return issueResponse({ challengeVerified: false, ip: getClientIp(request) });
}

export async function POST(request) {
  if (!chatSessionConfigured()) {
    return json(
      {
        ok: false,
        error: "Chat is temporarily unavailable.",
        code: "session_not_configured",
        sessionId: null,
        turnstileRequired: false,
      },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await readBody(request);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error.message,
        code: error.status === 413 ? "payload_too_large" : "invalid_payload",
        sessionId: null,
        turnstileRequired: turnstileConfigured(),
      },
      { status: error.status || 400 },
    );
  }

  const existing = await currentSession(request);
  if (validForCurrentChallenge(existing)) {
    if (body.rotate === true) {
      return issueResponse({
        challengeVerified: existing.challengeVerified,
        ip: getClientIp(request),
      });
    }
    return json(successBody(existing));
  }

  const ip = getClientIp(request);
  if (turnstileConfigured()) {
    const verification = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!verification.ok) {
      const unavailable = verification.reason === "timeout" || verification.reason === "unavailable";
      return json(
        {
          ok: false,
          error: unavailable
            ? "Verification is temporarily unavailable. Please try again."
            : "Please complete the verification challenge.",
          code: unavailable ? "challenge_unavailable" : "challenge_failed",
          sessionId: null,
          turnstileRequired: true,
        },
        { status: unavailable ? 503 : 403 },
      );
    }
  }

  return issueResponse({ challengeVerified: turnstileConfigured(), ip });
}
