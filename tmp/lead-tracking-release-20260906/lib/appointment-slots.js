import { SITE } from "../app/site.config";
import {
  addDaysToDateKey,
  dayOfWeekForDateKey,
  getShopDateTime,
  isPastShopSlot,
  isValidDateKey,
  isValidTimeKey,
} from "./shop-time";

export function validateShopSlot(date, time, { maxDays = 365, allowPast = false } = {}) {
  if (!isValidDateKey(date) || !isValidTimeKey(time)) {
    return { ok: false, code: "invalid_slot", message: "Invalid appointment date or time." };
  }
  if (!time.endsWith(":00")) {
    return { ok: false, code: "invalid_slot", message: "Appointments must start on the hour." };
  }

  const now = getShopDateTime();
  if (!allowPast && isPastShopSlot(date, time)) {
    return { ok: false, code: "slot_in_past", message: "That appointment time has already passed." };
  }
  if (date > addDaysToDateKey(now.dateKey, maxDays)) {
    return { ok: false, code: "slot_too_far", message: "That date is outside the scheduling window." };
  }

  const dayOfWeek = dayOfWeekForDateKey(date);
  const hours = SITE.hours.find((entry) => entry.day === dayOfWeek);
  if (!hours?.open || !hours?.close) {
    return { ok: false, code: "shop_closed", message: "The shop is closed on that day." };
  }
  if (time < hours.open || time >= hours.close) {
    return { ok: false, code: "outside_business_hours", message: "That time is outside business hours." };
  }

  return { ok: true, date, time, dayOfWeek };
}
