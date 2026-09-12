import { SITE } from "../app/site.config";
import { getAvailability } from "./chat-records-store";
import { addDaysToDateKey, dayOfWeekForDateKey, getShopDateTime, isPastShopSlot } from "./shop-time";

export async function nextWhatsAppAppointmentSlots(limit = 5) {
  const { bookedSet, blockedSet, blockedDays } = await getAvailability();
  const today = getShopDateTime().dateKey;
  const slots = [];
  for (let offset = 0; offset <= 7 && slots.length < limit; offset += 1) {
    const date = addDaysToDateKey(today, offset);
    if (blockedDays.has(date)) continue;
    const hours = SITE.hours.find((entry) => entry.day === dayOfWeekForDateKey(date));
    if (!hours?.open || !hours?.close) continue;
    for (let hour = Number(hours.open.slice(0, 2)); hour < Number(hours.close.slice(0, 2)) && slots.length < limit; hour += 1) {
      const time = `${String(hour).padStart(2, "0")}:00`;
      const key = `${date}_${time}`;
      if (isPastShopSlot(date, time) || bookedSet.has(key) || blockedSet.has(key)) continue;
      slots.push({ date, time });
    }
  }
  return slots;
}

export function formatWhatsAppSlots(slots, lang = "en") {
  const locale = lang === "es" ? "es-US" : "en-US";
  const heading = lang === "es" ? "Estos son los próximos horarios disponibles:" : "Here are the next available times:";
  const rows = slots.map((slot, index) => {
    const date = new Date(`${slot.date}T${slot.time}:00Z`);
    return `${index + 1}. ${new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date)}`;
  });
  const footer = lang === "es" ? "Responde con el número del horario que prefieres." : "Reply with the number of the time you prefer.";
  return [heading, ...rows, footer].join("\n");
}
