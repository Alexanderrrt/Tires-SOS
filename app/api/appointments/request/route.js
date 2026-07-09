import {
  CHAT_SESSION_COOKIE,
  turnstileConfigured,
  verifyChatSession,
} from "../../../../lib/chat-session";
import { checkChatRateLimits, getClientIp } from "../../../../lib/chat-rate-limit";
import { reserveAppointment } from "../../../../lib/chat-records-store";
import { deliverLeadNotification } from "../../../../lib/lead-notification-service";
import { validateShopSlot } from "../../../../lib/appointment-slots";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", ...extraHeaders },
  });
}

async function readBody(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw Object.assign(new Error("payload_too_large"), { status: 413 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw Object.assign(new Error("payload_too_large"), { status: 413 });
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("shape");
    return value;
  } catch {
    throw Object.assign(new Error("invalid_json"), { status: 400 });
  }
}

function reservationErrorStatus(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  if (code === "slot_unavailable" || /booked|blocked|unavailable|conflict|unique/.test(message)) return 409;
  if (code === "lead_incomplete" || /name|phone|contact/.test(message)) return 422;
  return 503;
}

export async function POST(request) {
  const token = request.cookies?.get?.(CHAT_SESSION_COOKIE)?.value || "";
  const session = await verifyChatSession(token);
  if (!session || (turnstileConfigured() && !session.challengeVerified)) {
    return json({ ok: false, error: "Please start a new secure chat session.", code: "invalid_session" }, 401);
  }

  const rate = await checkChatRateLimits({ ip: getClientIp(request), sessionId: session.id });
  if (!rate.allowed) {
    return json(
      { ok: false, error: "Too many requests. Please wait and try again.", code: "rate_limited" },
      429,
      { "Retry-After": String(rate.retryAfter) },
    );
  }

  let body;
  try {
    body = await readBody(request);
  } catch (error) {
    return json(
      { ok: false, error: "Invalid appointment request.", code: error.message },
      error.status || 400,
    );
  }

  if (body.privacyConsent !== true) {
    return json({ ok: false, error: "Privacy consent is required.", code: "privacy_consent_required" }, 400);
  }

  const date = typeof body.scheduledDate === "string" ? body.scheduledDate : "";
  const time = typeof body.scheduledTime === "string" ? body.scheduledTime : "";
  const validation = validateShopSlot(date, time, { maxDays: 7 });
  if (!validation.ok) {
    return json({ ok: false, error: validation.message, code: validation.code }, 400);
  }

  let reservation;
  try {
    reservation = await reserveAppointment(session.id, date, time);
  } catch (error) {
    const status = reservationErrorStatus(error);
    return json(
      {
        ok: false,
        error: status === 409
          ? "That time is no longer available."
          : status === 422
            ? "Please provide your name and phone number before selecting a time."
            : "The appointment request could not be saved.",
        code: status === 409 ? "slot_unavailable" : status === 422 ? "lead_incomplete" : "reservation_failed",
      },
      status,
    );
  }

  let notification = { accepted: false, status: "pending", attempts: 0 };
  try {
    notification = await deliverLeadNotification({ sessionId: session.id });
  } catch {
    // The reservation is durable even when the alert provider is unavailable.
    notification = { accepted: false, status: "pending", attempts: 0 };
  }

  return json({
    ok: true,
    persisted: reservation.persisted === true,
    appointment: {
      id: reservation.appointment?.id,
      status: reservation.appointment?.status || "requested",
      scheduledDate: date,
      scheduledTime: time,
    },
    notification,
  });
}
