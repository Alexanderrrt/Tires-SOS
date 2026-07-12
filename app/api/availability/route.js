import {
  CHAT_SESSION_COOKIE,
  turnstileConfigured,
  verifyChatSession,
} from "../../../lib/chat-session";
import { computeAvailableDays } from "../../../lib/availability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request) {
  const token = request.cookies?.get?.(CHAT_SESSION_COOKIE)?.value || "";
  const session = await verifyChatSession(token);
  if (!session || (turnstileConfigured() && !session.challengeVerified)) {
    return json({ error: "A valid chat session is required.", code: "invalid_session" }, 401);
  }

  try {
    const result = await computeAvailableDays();
    return json(result);
  } catch {
    return json({ error: "Availability is temporarily unavailable.", code: "availability_unavailable" }, 503);
  }
}
