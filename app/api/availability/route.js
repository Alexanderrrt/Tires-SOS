import { getAvailability } from "../../../lib/chat-records-store";
import {
  CHAT_SESSION_COOKIE,
  turnstileConfigured,
  verifyChatSession,
} from "../../../lib/chat-session";
import {
  addDaysToDateKey,
  dayOfWeekForDateKey,
  getShopDateTime,
} from "../../../lib/shop-time";
import { SITE } from "../../site.config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pad(value) {
  return String(value).padStart(2, "0");
}

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
    const { bookedSet, blockedSet, blockedDays } = await getAvailability();
    const now = getShopDateTime();
    const days = [];

    for (let offset = 0; offset < 7 && days.length < 5; offset += 1) {
      const date = addDaysToDateKey(now.dateKey, offset);
      const dayOfWeek = dayOfWeekForDateKey(date);
      const hours = SITE.hours.find((entry) => entry.day === dayOfWeek);
      if (!hours?.open || !hours?.close || blockedDays.has(date)) continue;

      const [openHour] = hours.open.split(":").map(Number);
      const [closeHour] = hours.close.split(":").map(Number);
      const slots = [];

      for (let hour = openHour; hour < closeHour; hour += 1) {
        const time = `${pad(hour)}:00`;
        if (date === now.dateKey && time <= now.timeKey) continue;
        const slotKey = `${date}_${time}`;
        if (!bookedSet.has(slotKey) && !blockedSet.has(slotKey)) slots.push(time);
      }

      if (slots.length) days.push({ date, dayOfWeek, slots });
    }

    return json({ days, timeZone: "America/Los_Angeles" });
  } catch {
    return json({ error: "Availability is temporarily unavailable.", code: "availability_unavailable" }, 503);
  }
}
