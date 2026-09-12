export const SHOP_TIME_ZONE = "America/Los_Angeles";

const WEEKDAY_TO_NUMBER = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

function pad(value) {
  return String(value).padStart(2, "0");
}

export function getShopDateTime(date = new Date()) {
  const values = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  const dateKey = `${values.year}-${values.month}-${values.day}`;
  const timeKey = `${values.hour}:${values.minute}`;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    dayOfWeek: WEEKDAY_TO_NUMBER[values.weekday],
    dateKey,
    timeKey,
  };
}

export function addDaysToDateKey(dateKey, amount) {
  if (!isValidDateKey(dateKey)) throw new Error("Invalid date.");
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function dayOfWeekForDateKey(dateKey) {
  if (!isValidDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export function isValidTimeKey(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function isPastShopSlot(dateKey, timeKey, now = new Date()) {
  if (!isValidDateKey(dateKey) || !isValidTimeKey(timeKey)) return true;
  const current = getShopDateTime(now);
  return `${dateKey}_${timeKey}` <= `${current.dateKey}_${current.timeKey}`;
}

export function formatShopSlot(dateKey, timeKey, lang = "en") {
  if (!isValidDateKey(dateKey) || !isValidTimeKey(timeKey)) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = timeKey.split(":").map(Number);
  // Noon UTC anchors the calendar date safely; the explicit time is formatted separately.
  const label = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  const clock = new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
  return `${label}, ${clock}`;
}
