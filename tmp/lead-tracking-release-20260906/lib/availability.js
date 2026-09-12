import { getAvailability } from "./chat-records-store";
import { addDaysToDateKey, dayOfWeekForDateKey, getShopDateTime } from "./shop-time";
import { SITE } from "../app/site.config";

function pad(value) {
  return String(value).padStart(2, "0");
}

export async function computeAvailableDays() {
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

  return { days, timeZone: "America/Los_Angeles" };
}
