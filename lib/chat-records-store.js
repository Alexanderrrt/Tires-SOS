import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { validateShopSlot } from "./appointment-slots";

const LEADS_TABLE = "chat_leads";
const APPOINTMENTS_TABLE = "chat_appointments";
const BLOCKED_TABLE = "chat_blocked_slots";
const MAX_LEADS = 120;
const MAX_APPOINTMENTS = 120;
const MAX_MESSAGES = 18;
const DEFAULT_RETENTION_DAYS = 90;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
const SHOP_TIME_ZONE = "America/Los_Angeles";

const LEAD_STATUSES = new Set(["new", "contacted", "booked", "done", "lost"]);
const APPOINTMENT_STATUSES = new Set(["requested", "confirmed", "completed", "no-show", "canceled"]);
const BOOKING_ACTIVE = new Set(["requested", "confirmed"]);

// Notification state is intentionally small and provider-neutral. Provider response
// bodies are never persisted because they may contain credentials or customer data.
export const NOTIFICATION_STATUSES = Object.freeze({
  NOT_READY: "not_ready",
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  SKIPPED: "skipped",
  UNKNOWN: "unknown",
});

const NOTIFICATION_RESULT_STATUSES = new Set([
  NOTIFICATION_STATUSES.SENT,
  NOTIFICATION_STATUSES.FAILED,
  NOTIFICATION_STATUSES.SKIPPED,
]);

const VEHICLE_MAKES = [
  "rolls royce",
  "alfa romeo",
  "mercedes benz",
  "land rover",
  "range rover",
  "volkswagen",
  "chevrolet",
  "mitsubishi",
  "toyota",
  "honda",
  "nissan",
  "hyundai",
  "ford",
  "chevy",
  "kia",
  "bmw",
  "mercedes",
  "audi",
  "mazda",
  "subaru",
  "dodge",
  "ram",
  "jeep",
  "chrysler",
  "lexus",
  "acura",
  "infiniti",
  "tesla",
  "volvo",
  "mini",
  "fiat",
  "gmc",
  "cadillac",
  "buick",
  "lincoln",
  "genesis",
  "scion",
  "porsche",
  "jaguar",
  "maserati",
  "bentley",
  "ferrari",
  "lamborghini",
  "rivian",
  "lucid",
  "polestar",
  "suzuki",
  "pontiac",
  "saturn",
  "mercury",
  "hummer",
  "saab",
  "isuzu",
  "smart",
];

const VEHICLE_STOP_WORDS = new Set([
  "today",
  "tomorrow",
  "morning",
  "afternoon",
  "evening",
  "manana",
  "hoy",
  "ahora",
  "genial",
  "great",
  "ok",
  "fine",
  "bien",
  "whatsapp",
  "is",
  "a",
  "an",
  "the",
  "my",
  "car",
  "vehicle",
  "es",
  "un",
  "una",
  "el",
  "la",
  "mi",
  "carro",
  "vehiculo",
  "para",
  "for",
  "oil",
  "change",
  "tires",
  "tire",
  "llantas",
  "llanta",
  "brakes",
  "brake",
  "frenos",
  "alignment",
  "alineacion",
  "appointment",
  "cita",
]);

const WEEKDAY_ALIASES = [
  { day: 0, names: ["sunday", "sun", "domingo"] },
  { day: 1, names: ["monday", "mon", "lunes"] },
  { day: 2, names: ["tuesday", "tue", "martes"] },
  { day: 3, names: ["wednesday", "wed", "miercoles"] },
  { day: 4, names: ["thursday", "thu", "jueves"] },
  { day: 5, names: ["friday", "fri", "viernes"] },
  { day: 6, names: ["saturday", "sat", "sabado"] },
];

let devMemory = {
  leads: [],
  appointments: [],
  blockedSlots: [],
};
let lastPurgeAt = 0;

function noStoreFetch(input, init = {}) {
  return fetch(input, { ...init, cache: "no-store" });
}

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^\uFEFF/, "").replace(/^\u00ef\u00bb\u00bf/, "");
}

export function recordsStoreConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(
    cleanEnv(process.env.SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false }, global: { fetch: noStoreFetch } },
  );
}

function nowIso() {
  return new Date().toISOString();
}

function stableId(prefix, sessionId) {
  if (sessionId) {
    const digest = createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
    return `${prefix}_${digest}`;
  }
  return `${prefix}_${randomUUID()}`;
}

function normalizeText(value, max = 500) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function foldedText(value) {
  return normalizeText(value, 6000)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function titleCase(value) {
  return normalizeText(value, 120).replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && typeof message.content === "string")
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: normalizeText(message.content, 1200),
    }))
    .filter((message) => message.content);
}

function userMessages(messages) {
  return messages.filter((message) => message.role === "user");
}

function transcriptText(messages) {
  return messages.map((message) => message.content).join("\n");
}

function latestUserText(messages) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function extractPhoneFromText(text) {
  const match = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? normalizeText(match[0], 40) : "";
}

function extractPhone(messages) {
  for (const message of [...userMessages(messages)].reverse()) {
    const phone = extractPhoneFromText(message.content);
    if (phone) return phone;
  }
  return "";
}

function cleanName(value) {
  const withoutPhone = value.replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, "");
  const withoutPrefs = withoutPhone
    .replace(/\b(whatsapp|text|sms|call|mensaje|llamada|llamar)\b.*$/i, "")
    .replace(/\b(and|y|phone|telefono|number|numero)\b.*$/i, "");
  const candidate = normalizeText(withoutPrefs.replace(/[^a-zA-Z\u00c0-\u017f\s.'-]/g, " "), 60);
  const words = candidate
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^(mi|my|name|nombre|is|es|soy|me|llamo|phone|telefono|numero|number|and|y)$/i.test(word));
  if (!words.length || words.length > 4) return "";
  const clean = titleCase(words.join(" "));
  if (/\b(Looking|Need|Want|Interested|Quote|Tire|Tires|Llanta|Llantas|Brakes|Frenos|Oil|Change|Aceite|Alignment|Alineacion|Battery|Bateria|Rim|Rims|Repair|Service|Appointment|Cita)\b/i.test(clean)) return "";
  return clean;
}

function extractName(_text, messages) {
  const patterns = [
    /\bmy name is\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40}?)(?=\b(?:and|y|phone|telefono|number|numero)\b|[.!?,]|$)/i,
    /\bname is\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40}?)(?=\b(?:and|y|phone|telefono|number|numero)\b|[.!?,]|$)/i,
    /\bmi nombre es\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40}?)(?=\b(?:y|telefono|numero|phone|number)\b|[.!?,]|$)/i,
    /\bme llamo\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40}?)(?=\b(?:y|telefono|numero|phone|number)\b|[.!?,]|$)/i,
  ];

  for (const message of [...userMessages(messages)].reverse()) {
    for (const pattern of patterns) {
      const match = message.content.match(pattern);
      if (match) {
        const candidate = cleanName(match[1]);
        if (candidate) return candidate;
      }
    }
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const previous = messages[index - 1];
    const previousText = foldedText(previous?.content || "");
    const askedForName = previous?.role === "assistant" &&
      (previousText.includes("name") || previousText.includes("nombre") || previousText.includes("llamas"));
    if (!askedForName) continue;
    const candidate = cleanName(message.content);
    if (candidate && !/^(Yes|Si|Whatsapp|Text|Call)$/i.test(candidate)) return candidate;
  }

  const phonePattern = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
  for (const message of [...userMessages(messages)].reverse()) {
    const phoneMatch = message.content.match(phonePattern);
    if (!phoneMatch) continue;
    const beforePhone = message.content.slice(0, phoneMatch.index).replace(/\s+$/, "");
    if (!/[,;]/.test(beforePhone)) continue;
    const parts = beforePhone.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
    const raw = parts.at(-1) || "";
    const candidate = cleanName(raw);
    if (candidate && !/^(Yes|Si|Whatsapp|Text|Call)$/i.test(candidate)) return candidate;
  }

  return "";
}

function extractTireSize(messages) {
  for (const message of [...userMessages(messages)].reverse()) {
    const match = message.content.match(/\b(?:P|LT)?\d{3}\/\d{2}(?:[Rr]|\/)\d{2}\b/);
    if (match) return normalizeText(match[0].toUpperCase(), 24);
  }
  return "";
}

function cleanModel(value) {
  const model = [];
  for (const word of foldedText(value).split(/\s+/).filter(Boolean)) {
    if (VEHICLE_STOP_WORDS.has(word)) {
      if (model.length) break;
      continue;
    }
    model.push(word);
    if (model.length === 4) break;
  }
  return model.join(" ");
}

function extractVehicle(messages) {
  const year = "((?:19|20)\\d{2})";

  for (const message of [...userMessages(messages)].reverse()) {
    const text = foldedText(message.content);
    for (const make of VEHICLE_MAKES) {
      const makePattern = escapeRegExp(make).replace(/\s+/g, "\\s+");
      const makeFirst = new RegExp(
        `\\b(${makePattern})\\s+([a-z0-9][a-z0-9-]*(?:\\s+[a-z0-9][a-z0-9-]*){0,3})\\s+${year}\\b`,
        "i",
      );
      const makeFirstMatch = text.match(makeFirst);
      if (makeFirstMatch) {
        const model = cleanModel(makeFirstMatch[2]);
        return titleCase([make, model, makeFirstMatch[3]].filter(Boolean).join(" "));
      }

      const yearFirst = new RegExp(
        `\\b${year}\\s+(${makePattern})\\s+([a-z0-9][a-z0-9-]*(?:\\s+[a-z0-9][a-z0-9-]*){0,3})\\b`,
        "i",
      );
      const yearFirstMatch = text.match(yearFirst);
      if (yearFirstMatch) {
        const model = cleanModel(yearFirstMatch[3] || "");
        return titleCase([make, model, yearFirstMatch[1]].filter(Boolean).join(" "));
      }

    }
  }

  // Support less common makes when the conversation context clearly asked for
  // a vehicle. Requiring both a year and at least two remaining words prevents
  // ordinary appointment dates from being mistaken for a make/model.
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    const text = foldedText(message.content);
    const previous = foldedText(messages[index - 1]?.content || "");
    const askedForVehicle = /(year.*make.*model|ano.*marca.*modelo)/i.test(previous);
    const vehicleCue = /\b(car|vehicle|carro|vehiculo)\b/i.test(text);
    if (!askedForVehicle && !vehicleCue) continue;

    const yearMatch = text.match(/\b((?:19|20)\d{2})\b/);
    if (!yearMatch) continue;
    const yearValue = yearMatch[1];
    const before = text.slice(0, yearMatch.index).trim().split(/\s+/).filter(Boolean);
    const after = text.slice((yearMatch.index || 0) + yearValue.length).trim().split(/\s+/).filter(Boolean);
    const nearby = (after.length >= 2 ? after.slice(0, 4) : before.slice(-4))
      .map((word) => word.replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean)
      .filter((word) => !VEHICLE_STOP_WORDS.has(word));
    if (nearby.length >= 2) return titleCase([...nearby.slice(0, 4), yearValue].join(" "));
  }

  return "";
}

function detectServiceInText(text) {
  const folded = foldedText(text);
  const checks = [
    [/(oil change|cambio de aceite|aceite)/i, "Oil change"],
    [/(flat|patch|plug|ponchad|reparacion de llanta)/i, "Flat repair"],
    [/(rotation|rotate|rotacion)/i, "Tire rotation"],
    [/(\btire\b|\btires\b|\bllanta\b|\bllantas\b|tire size|medida)/i, "Tires"],
    [/(brake|brakes|freno|frenos)/i, "Brakes"],
    [/(alignment|alineacion)/i, "Alignment"],
    [/(battery|bateria)/i, "Battery"],
    [/(rim|wheel|rin|rines)/i, "Rims / wheels"],
    [/(inspection|inspect|inspeccion|revisar)/i, "Inspection"],
    [/(diagnostic|diagnostico)/i, "Diagnostic"],
    [/(maintenance|mantenimiento|tune[ -]?up|afinacion)/i, "Maintenance"],
  ];
  return checks.find(([pattern]) => pattern.test(folded))?.[1] || "";
}

function detectService(messages) {
  for (const message of [...userMessages(messages)].reverse()) {
    const service = detectServiceInText(message.content);
    if (service) return service;
  }
  return "";
}

export function extractChatFields(messages = []) {
  const cleanMessages = sanitizeMessages(messages);
  const customerText = transcriptText(userMessages(cleanMessages));
  return {
    customerName: extractName(customerText, cleanMessages),
    phone: extractPhone(cleanMessages),
    vehicle: extractVehicle(cleanMessages),
    service: detectService(cleanMessages),
  };
}

function detectTiming(text) {
  const folded = foldedText(text);
  const stripped = folded.replace(/(?:p|lt)?\d{3}\/\d{2}(?:r|\/)\d{2}/gi, "");
  const match =
    stripped.match(/\b(today|tomorrow|this morning|this afternoon|tonight|asap|now|morning|afternoon|evening)\b/i) ||
    stripped.match(/\b(hoy|manana|esta tarde|esta manana|ahora|urgente)\b/i) ||
    stripped.match(/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i) ||
    stripped.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/i) ||
    stripped.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i) ||
    stripped.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  return match ? normalizeText(match[0], 80) : "";
}

function shopToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function validDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTimeString(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || "");
}

function extractClock(text) {
  const stripped = foldedText(text).replace(/(?:p|lt)?\d{3}\/\d{2}(?:r|\/)\d{2}/gi, "");
  const twelveHour = stripped.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toLowerCase() === "pm") hour += 12;
    return `${String(hour).padStart(2, "0")}:${twelveHour[2] || "00"}`;
  }
  const twentyFour = stripped.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!twentyFour) return "";
  return `${String(Number(twentyFour[1])).padStart(2, "0")}:${twentyFour[2]}`;
}

function extractDate(text) {
  const folded = foldedText(text).replace(/(?:p|lt)?\d{3}\/\d{2}(?:r|\/)\d{2}/gi, "");
  const iso = folded.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso && validDateString(iso[1])) return iso[1];

  const today = shopToday();
  if (/\b(today|hoy)\b/.test(folded)) return today;
  if (/\b(tomorrow|manana)\b/.test(folded)) return addDays(today, 1);

  const numeric = folded.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    let year = numeric[3] ? Number(numeric[3]) : Number(today.slice(0, 4));
    if (year < 100) year += 2000;
    let candidate = `${year}-${String(Number(numeric[1])).padStart(2, "0")}-${String(Number(numeric[2])).padStart(2, "0")}`;
    if (validDateString(candidate) && !numeric[3] && candidate < today) {
      candidate = `${year + 1}${candidate.slice(4)}`;
    }
    if (validDateString(candidate)) return candidate;
  }

  for (const alias of WEEKDAY_ALIASES) {
    const name = alias.names.find((value) => new RegExp(`\\b${value}\\b`, "i").test(folded));
    if (!name) continue;
    const dayNumberMatch = folded.match(new RegExp(`\\b${name}\\s+(\\d{1,2})\\b`, "i"));
    const expectedDayNumber = dayNumberMatch ? Number(dayNumberMatch[1]) : null;
    for (let offset = 0; offset <= 14; offset += 1) {
      const candidate = addDays(today, offset);
      const date = new Date(`${candidate}T12:00:00Z`);
      if (date.getUTCDay() !== alias.day) continue;
      if (expectedDayNumber && date.getUTCDate() !== expectedDayNumber) continue;
      return candidate;
    }
  }

  return "";
}

function extractPreference(messages) {
  for (const message of [...userMessages(messages)].reverse()) {
    const preferredDate = extractDate(message.content);
    const preferredTime = extractClock(message.content);
    const preferredTimeText = detectTiming(message.content);
    if (preferredDate || preferredTime || preferredTimeText) {
      return { preferredDate, preferredTime, preferredTimeText };
    }
  }
  return { preferredDate: "", preferredTime: "", preferredTimeText: "" };
}

function wantsAppointment(text) {
  return /(appointment|book|booking|schedule|come in|drop off|cita|agendar|programar|reservar|puedo ir|pasar)/i.test(
    foldedText(text),
  );
}

// Explicit opt-in to being contacted later, short of booking an appointment
// outright (e.g. the bot asked "want the shop to reach out?" and they agreed).
function wantsContactLater(text) {
  return /(contact me|call me( back)?|reach out|text me|follow up|get back to me|contactame|llamame|llamenme|comuniquense|contactenme|me pueden contactar|manden(me)? info)/i.test(
    foldedText(text),
  );
}

// A lead is only captured when the customer showed real booking/contact
// intent — not just because they asked a price/hours question. This avoids
// turning every casual "how much for X" chat into a lead the shop has to
// review.
function hasLeadSignal(text) {
  return wantsAppointment(text) || wantsContactLater(text);
}

// Uses `extracted` (this conversation's own messages only), never the
// existing-lead-backfilled `fields` — otherwise a prior, unrelated session
// (same browser, different topic) leaks its stored name/phone in as a
// "fallback," making an ordinary price question look like a ready-to-book
// lead and silently overwriting the earlier lead's real data.
function shouldCaptureBookingLead(messages, extracted, customerText) {
  if (hasLeadSignal(customerText)) return true;
  if (extracted?.customerName && extracted?.phone && extracted?.vehicle && (extracted?.service || extracted?.preferredDate || extracted?.preferredTime || extracted?.preferredTimeText)) {
    return true;
  }
  const latest = latestUserText(messages);
  const latestFolded = foldedText(latest);
  const readyWords = /\b(name|phone|call|text|contact|book|schedule|appointment|cita|agendar|reservar)\b/.test(latestFolded);
  return Boolean(extracted?.customerName && extracted?.phone && extracted?.vehicle && readyWords);
}

function preferenceLabel(fields) {
  return [fields.preferredDate, fields.preferredTime || fields.preferredTimeText].filter(Boolean).join(" ");
}

function summarize(fields, latestText) {
  const parts = [
    fields.service && `Service: ${fields.service}`,
    fields.vehicle && `Vehicle: ${fields.vehicle}`,
    preferenceLabel(fields) && `Timing: ${preferenceLabel(fields)}`,
    fields.phone && `Phone: ${fields.phone}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : normalizeText(latestText, 220);
}

function normalizedDbTime(value) {
  if (typeof value !== "string") return "";
  const match = value.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function leadFromRow(row) {
  if (!row) return null;
  const structuredTime = normalizedDbTime(row.preferred_time);
  return {
    id: row.id,
    sessionId: row.session_id,
    source: row.source || "",
    lang: row.lang === "es" ? "es" : "en",
    status: row.status || "new",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appointmentRequested: Boolean(row.appointment_requested),
    summary: row.summary || "",
    customerName: row.customer_name || "",
    phone: row.phone || "",
    vehicle: row.vehicle || "",
    tireSize: row.tire_size || "",
    service: row.service || "",
    preferredDate: row.preferred_date || "",
    preferredTime: structuredTime || row.preferred_time_text || "",
    preferredTimeText: row.preferred_time_text || "",
    lastMessage: row.last_message || "",
    assistantMessage: row.assistant_message || "",
    transcript: Array.isArray(row.transcript) ? row.transcript : [],
    notificationStatus: row.notification_status || NOTIFICATION_STATUSES.NOT_READY,
    notificationAttempts: Number(row.notification_attempts) || 0,
    notificationLastAttemptAt: row.notification_last_attempt_at || "",
    notificationSentAt: row.notification_sent_at || "",
    notificationLastErrorCode: row.notification_last_error_code || "",
  };
}

function appointmentFromRow(row) {
  if (!row) return null;
  const structuredTime = normalizedDbTime(row.preferred_time);
  return {
    id: row.id,
    leadId: row.lead_id || "",
    sessionId: row.session_id,
    status: row.status || "requested",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: row.customer_name || "",
    phone: row.phone || "",
    service: row.service || "",
    vehicle: row.vehicle || "",
    preferredDate: row.preferred_date || "",
    preferredTime: structuredTime || row.preferred_time_text || "",
    preferredTimeText: row.preferred_time_text || "",
    notes: row.notes || "",
    scheduledDate: row.scheduled_date || "",
    scheduledTime: normalizedDbTime(row.scheduled_time),
  };
}

function blockedFromRow(row) {
  return {
    date: row.slot_date,
    time: row.is_all_day ? "all" : normalizedDbTime(row.slot_time),
    createdAt: row.created_at,
  };
}

function leadInsertRow(lead) {
  return {
    id: lead.id,
    session_id: lead.sessionId,
    source: lead.source,
    lang: lead.lang,
    status: lead.status,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    appointment_requested: lead.appointmentRequested,
    summary: lead.summary,
    customer_name: lead.customerName,
    phone: lead.phone,
    vehicle: lead.vehicle,
    tire_size: lead.tireSize,
    service: lead.service,
    preferred_date: lead.preferredDate || null,
    preferred_time: validTimeString(lead.preferredTime) ? lead.preferredTime : null,
    preferred_time_text: lead.preferredTimeText,
    last_message: lead.lastMessage,
    assistant_message: lead.assistantMessage,
    transcript: lead.transcript,
    notification_status: lead.notificationStatus || NOTIFICATION_STATUSES.NOT_READY,
  };
}

function leadUpdateRow(lead) {
  const row = leadInsertRow(lead);
  delete row.id;
  delete row.session_id;
  delete row.status;
  delete row.created_at;
  delete row.notification_status;
  return row;
}

function appointmentInsertRow(appointment) {
  return {
    id: appointment.id,
    lead_id: appointment.leadId || null,
    session_id: appointment.sessionId,
    status: appointment.status,
    created_at: appointment.createdAt,
    updated_at: appointment.updatedAt,
    customer_name: appointment.customerName,
    phone: appointment.phone,
    service: appointment.service,
    vehicle: appointment.vehicle,
    preferred_date: appointment.preferredDate || null,
    preferred_time: validTimeString(appointment.preferredTime) ? appointment.preferredTime : null,
    preferred_time_text: appointment.preferredTimeText || "",
    notes: appointment.notes,
    scheduled_date: appointment.scheduledDate || null,
    scheduled_time: appointment.scheduledTime || null,
  };
}

function appointmentLeadUpdateRow(appointment) {
  const row = appointmentInsertRow(appointment);
  delete row.id;
  delete row.session_id;
  delete row.status;
  delete row.created_at;
  delete row.scheduled_date;
  delete row.scheduled_time;
  return row;
}

function isUniqueViolation(error) {
  return error?.code === "23505";
}

export function chatRetentionDays() {
  const configured = Number(process.env.CHAT_RETENTION_DAYS);
  if (!Number.isFinite(configured)) return DEFAULT_RETENTION_DAYS;
  return Math.min(3650, Math.max(1, Math.floor(configured)));
}

export async function purgeChatRecords({ olderThanDays = chatRetentionDays() } = {}) {
  const days = Math.min(3650, Math.max(1, Math.floor(Number(olderThanDays) || DEFAULT_RETENTION_DAYS)));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (!recordsStoreConfigured()) {
    const beforeLeads = devMemory.leads.length;
    const beforeAppointments = devMemory.appointments.length;
    devMemory.appointments = devMemory.appointments.filter((item) => (item.updatedAt || item.createdAt) >= cutoff);
    const retainedLeadIds = new Set(
      devMemory.leads
        .filter((item) => (item.updatedAt || item.createdAt) >= cutoff)
        .map((item) => item.id),
    );
    devMemory.leads = devMemory.leads.filter((item) => retainedLeadIds.has(item.id));
    devMemory.appointments = devMemory.appointments.filter(
      (item) => !item.leadId || retainedLeadIds.has(item.leadId),
    );
    return {
      ok: true,
      persisted: false,
      deletedLeads: beforeLeads - devMemory.leads.length,
      deletedAppointments: beforeAppointments - devMemory.appointments.length,
      cutoff,
    };
  }

  const db = client();
  const { data: appointmentRows, error: appointmentError } = await db
    .from(APPOINTMENTS_TABLE)
    .delete()
    .lt("updated_at", cutoff)
    .select("id");
  if (appointmentError) throw new Error(appointmentError.message);

  const { data: leadRows, error: leadError } = await db
    .from(LEADS_TABLE)
    .delete()
    .lt("updated_at", cutoff)
    .select("id");
  if (leadError) throw new Error(leadError.message);

  return {
    ok: true,
    persisted: true,
    deletedLeads: leadRows?.length || 0,
    deletedAppointments: appointmentRows?.length || 0,
    cutoff,
  };
}

async function maybePurgeChatRecords() {
  const now = Date.now();
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;
  try {
    await purgeChatRecords();
  } catch {
    // Retention is best effort; a purge outage must not interrupt a customer chat.
  }
}

export async function getChatRecords() {
  await maybePurgeChatRecords();
  if (!recordsStoreConfigured()) {
    return {
      leads: [...devMemory.leads],
      appointments: [...devMemory.appointments],
      blockedSlots: [...devMemory.blockedSlots],
    };
  }

  try {
    const db = client();
    const [leadResult, appointmentResult, blockedResult] = await Promise.all([
      db.from(LEADS_TABLE).select("*").order("updated_at", { ascending: false }).limit(MAX_LEADS),
      db.from(APPOINTMENTS_TABLE).select("*").order("updated_at", { ascending: false }).limit(MAX_APPOINTMENTS),
      db.from(BLOCKED_TABLE).select("*").order("slot_date", { ascending: true }),
    ]);
    if (leadResult.error) throw leadResult.error;
    if (appointmentResult.error) throw appointmentResult.error;
    if (blockedResult.error) throw blockedResult.error;
    return {
      leads: (leadResult.data || []).map(leadFromRow),
      appointments: (appointmentResult.data || []).map(appointmentFromRow),
      blockedSlots: (blockedResult.data || []).map(blockedFromRow),
    };
  } catch {
    return { leads: [], appointments: [], blockedSlots: [] };
  }
}

export async function getLeadById(id) {
  const cleanId = normalizeText(id, 160);
  if (!cleanId) return null;
  if (!recordsStoreConfigured()) return devMemory.leads.find((lead) => lead.id === cleanId) || null;
  const { data, error } = await client().from(LEADS_TABLE).select("*").eq("id", cleanId).maybeSingle();
  if (error) throw new Error(error.message);
  return leadFromRow(data);
}

export async function getLeadBySession(sessionId) {
  const cleanSessionId = normalizeText(sessionId, 120);
  if (!cleanSessionId) return null;
  if (!recordsStoreConfigured()) return devMemory.leads.find((lead) => lead.sessionId === cleanSessionId) || null;
  const { data, error } = await client()
    .from(LEADS_TABLE)
    .select("*")
    .eq("session_id", cleanSessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return leadFromRow(data);
}

async function getAppointmentBySession(sessionId) {
  if (!recordsStoreConfigured()) {
    return devMemory.appointments.find((appointment) => appointment.sessionId === sessionId) || null;
  }
  const { data, error } = await client()
    .from(APPOINTMENTS_TABLE)
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return appointmentFromRow(data);
}

async function persistLead(lead, existingLead) {
  if (!recordsStoreConfigured()) {
    devMemory.leads = [lead, ...devMemory.leads.filter((item) => item.sessionId !== lead.sessionId)].slice(0, MAX_LEADS);
    return lead;
  }

  const db = client();
  if (existingLead) {
    const { data, error } = await db
      .from(LEADS_TABLE)
      .update(leadUpdateRow(lead))
      .eq("id", existingLead.id)
      .select("*")
      .single();
    if (!error) return leadFromRow(data);
    if (error.code !== "PGRST116") throw new Error(error.message);
  }

  const { data, error } = await db.from(LEADS_TABLE).insert(leadInsertRow(lead)).select("*").single();
  if (!error) return leadFromRow(data);
  if (!isUniqueViolation(error)) throw new Error(error.message);

  const racedLead = await getLeadBySession(lead.sessionId);
  if (!racedLead) throw new Error("Lead persistence conflict.");
  return persistLead({ ...lead, id: racedLead.id, status: racedLead.status, createdAt: racedLead.createdAt }, racedLead);
}

async function persistAppointment(appointment, existingAppointment) {
  if (!recordsStoreConfigured()) {
    const preserved = existingAppointment
      ? {
          ...appointment,
          id: existingAppointment.id,
          status: existingAppointment.status,
          createdAt: existingAppointment.createdAt,
          scheduledDate: existingAppointment.scheduledDate || "",
          scheduledTime: existingAppointment.scheduledTime || "",
        }
      : appointment;
    devMemory.appointments = [
      preserved,
      ...devMemory.appointments.filter((item) => item.sessionId !== appointment.sessionId),
    ].slice(0, MAX_APPOINTMENTS);
    return preserved;
  }

  const db = client();
  if (existingAppointment) {
    const { data, error } = await db
      .from(APPOINTMENTS_TABLE)
      .update(appointmentLeadUpdateRow(appointment))
      .eq("id", existingAppointment.id)
      .select("*")
      .single();
    if (!error) return appointmentFromRow(data);
    if (error.code !== "PGRST116") throw new Error(error.message);
  }

  const { data, error } = await db
    .from(APPOINTMENTS_TABLE)
    .insert(appointmentInsertRow(appointment))
    .select("*")
    .single();
  if (!error) return appointmentFromRow(data);
  if (!isUniqueViolation(error)) throw new Error(error.message);

  const racedAppointment = await getAppointmentBySession(appointment.sessionId);
  if (!racedAppointment) throw new Error("Appointment persistence conflict.");
  return persistAppointment({ ...appointment, id: racedAppointment.id }, racedAppointment);
}

function normalizeIdentifier(identifier) {
  if (typeof identifier === "string") {
    const value = normalizeText(identifier, 160);
    return { leadId: value, sessionId: value };
  }
  return {
    leadId: normalizeText(identifier?.id || identifier?.leadId, 160),
    sessionId: normalizeText(identifier?.sessionId, 120),
  };
}

function findDevLead(identifier) {
  const { leadId, sessionId } = normalizeIdentifier(identifier);
  return devMemory.leads.find((lead) => (leadId && lead.id === leadId) || (sessionId && lead.sessionId === sessionId));
}

export async function claimLeadNotification(identifier) {
  const { leadId, sessionId } = normalizeIdentifier(identifier);
  if (!leadId && !sessionId) return { claimed: false, lead: null };

  if (!recordsStoreConfigured()) {
    const lead = findDevLead(identifier);
    if (!lead || !lead.customerName || !lead.phone ||
        ![NOTIFICATION_STATUSES.NOT_READY, NOTIFICATION_STATUSES.FAILED, NOTIFICATION_STATUSES.SKIPPED].includes(lead.notificationStatus) ||
        lead.notificationAttempts >= 3) {
      return { claimed: false, lead: lead || null };
    }
    const updated = { ...lead, notificationStatus: NOTIFICATION_STATUSES.PENDING, notificationLastAttemptAt: nowIso() };
    devMemory.leads = devMemory.leads.map((item) => (item.id === updated.id ? updated : item));
    return { claimed: true, lead: updated };
  }

  const { data, error } = await client().rpc("claim_chat_lead_notification", {
    p_lead_id: leadId || null,
    p_session_id: sessionId || null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { claimed: Boolean(row), lead: leadFromRow(row) };
}

function notificationOutcome(outcome) {
  let status = NOTIFICATION_RESULT_STATUSES.has(outcome?.status) ? outcome.status : "";
  if (!status) {
    if (outcome?.sent === true) status = NOTIFICATION_STATUSES.SENT;
    else if (outcome?.reason === "not_configured") status = NOTIFICATION_STATUSES.SKIPPED;
    else status = NOTIFICATION_STATUSES.FAILED;
  }
  const proposedCode = outcome?.lastErrorCode || outcome?.errorCode ||
    (status === NOTIFICATION_STATUSES.SKIPPED ? outcome?.reason : status === NOTIFICATION_STATUSES.FAILED ? "delivery_failed" : "");
  const lastErrorCode = normalizeText(proposedCode, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "_");
  return { status, lastErrorCode };
}

export async function recordNotificationResult(identifier, outcome = {}) {
  const { leadId, sessionId } = normalizeIdentifier(identifier);
  if (!leadId && !sessionId) throw new Error("Missing lead identifier.");
  const { status, lastErrorCode } = notificationOutcome(outcome);

  if (!recordsStoreConfigured()) {
    const lead = findDevLead(identifier);
    if (!lead) throw new Error("Lead not found.");
    const timestamp = nowIso();
    const updated = {
      ...lead,
      notificationStatus: status,
      notificationAttempts: (lead.notificationAttempts || 0) + 1,
      notificationLastAttemptAt: timestamp,
      notificationSentAt: status === NOTIFICATION_STATUSES.SENT ? timestamp : lead.notificationSentAt || "",
      notificationLastErrorCode: status === NOTIFICATION_STATUSES.SENT ? "" : lastErrorCode,
      updatedAt: timestamp,
    };
    devMemory.leads = devMemory.leads.map((item) => (item.id === updated.id ? updated : item));
    return { ok: true, persisted: false, lead: updated };
  }

  const { data, error } = await client().rpc("record_chat_notification_result", {
    p_lead_id: leadId || null,
    p_session_id: sessionId || null,
    p_status: status,
    p_error_code: lastErrorCode || null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Lead not found.");
  return { ok: true, persisted: true, lead: leadFromRow(row) };
}

export async function captureChatRecord({ sessionId, context = "shop", lang = "en", messages = [], assistantMessage = "" }) {
  const cleanMessages = sanitizeMessages(messages);
  const cleanSessionId = normalizeText(sessionId, 120);
  if (!cleanMessages.length || !cleanSessionId) return { captured: false };

  await maybePurgeChatRecords();
  const customerText = transcriptText(userMessages(cleanMessages));
  const newest = latestUserText(cleanMessages);
  const timestamp = nowIso();
  const existingLead = await getLeadBySession(cleanSessionId);
  // Scheduling is handled exclusively by the availability picker. Free-form
  // dates, times, tire sizes, brands, and other technical details must not
  // become appointment requirements or create a partially scheduled record.
  const preference = { preferredDate: "", preferredTime: "", preferredTimeText: "" };
  const extracted = {
    customerName: extractName(customerText, cleanMessages),
    phone: extractPhone(cleanMessages),
    vehicle: extractVehicle(cleanMessages),
    tireSize: "",
    service: detectService(cleanMessages),
    ...preference,
  };
  const fields = {
    customerName: extracted.customerName || existingLead?.customerName || "",
    phone: extracted.phone || existingLead?.phone || "",
    vehicle: extracted.vehicle || existingLead?.vehicle || "",
    tireSize: "",
    service: extracted.service || existingLead?.service || "",
    preferredDate: existingLead?.preferredDate || "",
    preferredTime: validTimeString(existingLead?.preferredTime) ? existingLead.preferredTime : "",
    preferredTimeText: existingLead?.preferredTimeText || "",
  };
  if (!shouldCaptureBookingLead(cleanMessages, extracted, customerText)) return { captured: false };
  const appointmentRequested = Boolean(
    existingLead?.appointmentRequested
      || wantsAppointment(customerText)
      || (fields.customerName && fields.phone && fields.vehicle && fields.service),
  );
  const lead = {
    id: existingLead?.id || stableId("lead", cleanSessionId),
    sessionId: cleanSessionId,
    source: context === "quote" ? "Quote chat" : "Site chat",
    lang: lang === "es" ? "es" : "en",
    status: existingLead?.status || "new",
    createdAt: existingLead?.createdAt || timestamp,
    updatedAt: timestamp,
    appointmentRequested,
    summary: summarize(fields, newest),
    ...fields,
    lastMessage: normalizeText(newest, 400),
    assistantMessage: normalizeText(assistantMessage, 700) || existingLead?.assistantMessage || "",
    transcript: cleanMessages,
    notificationStatus: existingLead?.notificationStatus || NOTIFICATION_STATUSES.NOT_READY,
    notificationAttempts: existingLead?.notificationAttempts || 0,
    notificationLastAttemptAt: existingLead?.notificationLastAttemptAt || "",
    notificationSentAt: existingLead?.notificationSentAt || "",
    notificationLastErrorCode: existingLead?.notificationLastErrorCode || "",
  };

  if (appointmentRequested) lead.appointmentRequested = true;

  const savedLead = await persistLead(lead, existingLead);
  let savedAppointment = null;
  if (appointmentRequested) {
    const existingAppointment = await getAppointmentBySession(cleanSessionId);
    // Do not create an appointment until a real date and time are selected.
    // Existing scheduled appointments may still receive corrected contact,
    // vehicle, or service information from the same conversation.
    if (existingAppointment?.scheduledDate && existingAppointment?.scheduledTime) {
    const appointment = {
      id: existingAppointment.id,
      leadId: savedLead.id,
      sessionId: cleanSessionId,
      status: existingAppointment.status || "confirmed",
      createdAt: existingAppointment.createdAt || timestamp,
      updatedAt: timestamp,
      customerName: savedLead.customerName,
      phone: savedLead.phone,
      service: savedLead.service,
      vehicle: savedLead.vehicle,
      preferredDate: savedLead.preferredDate,
      preferredTime: validTimeString(savedLead.preferredTime) ? savedLead.preferredTime : "",
      preferredTimeText: savedLead.preferredTimeText,
      notes: summarize(savedLead, ""),
      scheduledDate: existingAppointment.scheduledDate,
      scheduledTime: existingAppointment.scheduledTime,
    };
    savedAppointment = await persistAppointment(appointment, existingAppointment);
    }
  }

  return {
    captured: true,
    leadId: savedLead.id,
    appointmentId: savedAppointment?.id || null,
    persisted: recordsStoreConfigured(),
  };
}

export async function updateRecordStatus(type, id, status) {
  if (type !== "appointment" && type !== "lead") throw new Error("Invalid record type.");
  const allowed = type === "appointment" ? APPOINTMENT_STATUSES : LEAD_STATUSES;
  if (!allowed.has(status)) throw new Error("Invalid status.");
  const timestamp = nowIso();

  if (!recordsStoreConfigured()) {
    const key = type === "appointment" ? "appointments" : "leads";
    let found = false;
    devMemory[key] = devMemory[key].map((record) => {
      if (record.id !== id) return record;
      found = true;
      return { ...record, status, updatedAt: timestamp };
    });
    if (!found) throw new Error("Record not found.");
    return { ok: true, persisted: false };
  }

  const table = type === "appointment" ? APPOINTMENTS_TABLE : LEADS_TABLE;
  const { data, error } = await client()
    .from(table)
    .update({ status, updated_at: timestamp })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Record not found.");
  return { ok: true, persisted: true };
}

export async function deleteRecord(type, id) {
  if (type !== "appointment" && type !== "lead") throw new Error("Invalid record type.");
  if (!recordsStoreConfigured()) {
    if (type === "appointment") {
      const exists = devMemory.appointments.some((appointment) => appointment.id === id);
      if (!exists) throw new Error("Record not found.");
      devMemory.appointments = devMemory.appointments.filter((appointment) => appointment.id !== id);
      return { ok: true, persisted: false, deleted: { type, id, appointmentIds: [id], leadIds: [] } };
    }
    const lead = devMemory.leads.find((item) => item.id === id);
    if (!lead) throw new Error("Record not found.");
    const appointmentIds = devMemory.appointments
      .filter((appointment) => appointment.leadId === id || appointment.sessionId === lead.sessionId)
      .map((appointment) => appointment.id);
    devMemory.leads = devMemory.leads.filter((item) => item.id !== id);
    devMemory.appointments = devMemory.appointments.filter((item) => !appointmentIds.includes(item.id));
    return { ok: true, persisted: false, deleted: { type, id, appointmentIds, leadIds: [id] } };
  }

  const db = client();
  if (type === "appointment") {
    const { data, error } = await db.from(APPOINTMENTS_TABLE).delete().eq("id", id).select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("Record not found.");
    return { ok: true, persisted: true, deleted: { type, id, appointmentIds: [id], leadIds: [] } };
  }

  const { data: appointmentRows, error: appointmentError } = await db
    .from(APPOINTMENTS_TABLE)
    .select("id")
    .eq("lead_id", id);
  if (appointmentError) throw new Error(appointmentError.message);
  const { data, error } = await db.from(LEADS_TABLE).delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Record not found.");
  return {
    ok: true,
    persisted: true,
    deleted: { type, id, appointmentIds: (appointmentRows || []).map((row) => row.id), leadIds: [id] },
  };
}

function reservationError(error) {
  const message = error?.message || "Appointment reservation failed.";
  const result = new Error(message.replace(/^CHAT_RESERVATION_/, "").replaceAll("_", " ").toLowerCase());
  result.code = message.startsWith("CHAT_RESERVATION_") ? message : error?.code || "reservation_failed";
  return result;
}

export async function reserveAppointment(identifier, scheduledDate, scheduledTime) {
  const cleanIdentifier = normalizeText(
    typeof identifier === "object" ? identifier.id || identifier.appointmentId || identifier.sessionId : identifier,
    160,
  );
  const date = normalizeText(scheduledDate, 10);
  const time = normalizeText(scheduledTime, 5);
  if (!cleanIdentifier) throw new Error("Missing appointment or session identifier.");
  if (!validDateString(date)) throw new Error("Invalid appointment date.");
  if (!validTimeString(time)) throw new Error("Invalid appointment time.");
  const slotValidation = validateShopSlot(date, time, { maxDays: 365 });
  if (!slotValidation.ok) {
    throw Object.assign(new Error(slotValidation.message), { code: slotValidation.code });
  }

  if (!recordsStoreConfigured()) {
    let appointment = devMemory.appointments.find(
      (item) => item.id === cleanIdentifier || item.sessionId === cleanIdentifier,
    );
    const lead = appointment
      ? devMemory.leads.find((item) => item.id === appointment.leadId || item.sessionId === appointment.sessionId)
      : devMemory.leads.find((item) => item.id === cleanIdentifier || item.sessionId === cleanIdentifier);
    if (!lead) throw Object.assign(new Error("Lead not found."), { code: "CHAT_RESERVATION_LEAD_NOT_FOUND" });
    if (!lead.service || !lead.vehicle || !lead.customerName || !lead.phone) {
      throw Object.assign(new Error("Service, vehicle, name, and phone are required before reserving."), { code: "CHAT_RESERVATION_DETAILS_REQUIRED" });
    }
    lead.appointmentRequested = true;
    lead.preferredDate = lead.preferredDate || date;
    lead.preferredTime = lead.preferredTime || time;
    const blocked = devMemory.blockedSlots.some((slot) => slot.date === date && (slot.time === "all" || slot.time === time));
    if (blocked) throw Object.assign(new Error("Time slot is blocked."), { code: "CHAT_RESERVATION_BLOCKED" });
    const conflict = devMemory.appointments.some(
      (item) => item.id !== appointment?.id && item.scheduledDate === date && item.scheduledTime === time && BOOKING_ACTIVE.has(item.status),
    );
    if (conflict) throw Object.assign(new Error("Time slot is already booked."), { code: "CHAT_RESERVATION_CONFLICT" });
    appointment = appointment || {
      id: stableId("appt", lead.sessionId),
      leadId: lead.id,
      sessionId: lead.sessionId,
      createdAt: nowIso(),
      customerName: lead.customerName,
      phone: lead.phone,
      service: lead.service,
      vehicle: lead.vehicle,
      preferredDate: lead.preferredDate,
      preferredTime: lead.preferredTime,
      preferredTimeText: lead.preferredTimeText,
      notes: lead.summary,
    };
    const updated = { ...appointment, scheduledDate: date, scheduledTime: time, status: "confirmed", updatedAt: nowIso() };
    devMemory.appointments = [updated, ...devMemory.appointments.filter((item) => item.id !== updated.id)];
    return { ok: true, persisted: false, appointment: updated };
  }

  const { data, error } = await client().rpc("reserve_chat_appointment", {
    p_identifier: cleanIdentifier,
    p_scheduled_date: date,
    p_scheduled_time: time,
  });
  if (error) throw reservationError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Appointment reservation failed.");
  const leadId = typeof row.lead_id === "string" ? row.lead_id : "";
  const sessionId = typeof row.session_id === "string" ? row.session_id : cleanIdentifier;
  if (leadId || sessionId) {
    const updatePayload = {
      appointment_requested: true,
      preferred_date: date,
      preferred_time: time,
      updated_at: nowIso(),
    };
    try {
      let query = client().from(LEADS_TABLE).update(updatePayload);
      query = leadId ? query.eq("id", leadId) : query.eq("session_id", sessionId);
      await query.select("id");
    } catch {
      // The appointment was committed atomically by the RPC. A secondary lead
      // metadata update must never turn that success into a false 503 response.
    }
  }
  return { ok: true, persisted: true, appointment: appointmentFromRow(row) };
}

export function reserveAppointmentForSession(sessionId, scheduledDate, scheduledTime) {
  return reserveAppointment({ sessionId }, scheduledDate, scheduledTime);
}

export function scheduleAppointment(id, scheduledDate, scheduledTime) {
  return reserveAppointment(id, scheduledDate, scheduledTime);
}

export async function unscheduleAppointment(id) {
  const timestamp = nowIso();
  if (!recordsStoreConfigured()) {
    const appointment = devMemory.appointments.find((item) => item.id === id);
    if (!appointment) throw new Error("Appointment not found.");
    devMemory.appointments = devMemory.appointments.map((item) =>
      item.id === id ? { ...item, scheduledDate: "", scheduledTime: "", status: "requested", updatedAt: timestamp } : item,
    );
    return { ok: true, persisted: false };
  }
  const { data, error } = await client()
    .from(APPOINTMENTS_TABLE)
    .update({ scheduled_date: null, scheduled_time: null, status: "requested", updated_at: timestamp })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Appointment not found.");
  return { ok: true, persisted: true };
}

export async function blockSlot(date, time) {
  if (!validDateString(date) || (time !== "all" && !validTimeString(time))) throw new Error("Invalid date or time.");
  if (!recordsStoreConfigured()) {
    const already = devMemory.blockedSlots.some((slot) => slot.date === date && slot.time === time);
    if (already) return { ok: true, action: "already_blocked", persisted: false };
    const conflict = devMemory.appointments.some(
      (item) => item.scheduledDate === date && (time === "all" || item.scheduledTime === time) && BOOKING_ACTIVE.has(item.status),
    );
    if (conflict) throw new Error("Cannot block a reserved time slot.");
    devMemory.blockedSlots.push({ date, time, createdAt: nowIso() });
    return { ok: true, action: "blocked", persisted: false };
  }
  const { data, error } = await client().rpc("block_chat_slot", {
    p_slot_date: date,
    p_slot_time: time === "all" ? null : time,
    p_all_day: time === "all",
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, action: row?.action || "blocked", persisted: true };
}

export async function unblockSlot(date, time) {
  if (!validDateString(date) || (time !== "all" && !validTimeString(time))) throw new Error("Invalid date or time.");
  if (!recordsStoreConfigured()) {
    const before = devMemory.blockedSlots.length;
    devMemory.blockedSlots = devMemory.blockedSlots.filter((slot) => !(slot.date === date && slot.time === time));
    return { ok: true, action: before === devMemory.blockedSlots.length ? "not_found" : "unblocked", persisted: false };
  }
  let query = client().from(BLOCKED_TABLE).delete().eq("slot_date", date).eq("is_all_day", time === "all");
  if (time !== "all") query = query.eq("slot_time", time);
  const { data, error } = await query.select("id");
  if (error) throw new Error(error.message);
  return { ok: true, action: data?.length ? "unblocked" : "not_found", persisted: true };
}

export async function getAvailability() {
  if (!recordsStoreConfigured()) {
    const bookedSet = new Set();
    devMemory.appointments.forEach((appointment) => {
      if (appointment.scheduledDate && appointment.scheduledTime && BOOKING_ACTIVE.has(appointment.status)) {
        bookedSet.add(`${appointment.scheduledDate}_${appointment.scheduledTime}`);
      }
    });
    const blockedSet = new Set();
    const blockedDays = new Set();
    devMemory.blockedSlots.forEach((slot) => {
      if (slot.time === "all") blockedDays.add(slot.date);
      else blockedSet.add(`${slot.date}_${slot.time}`);
    });
    return { bookedSet, blockedSet, blockedDays, blockedSlots: [...devMemory.blockedSlots] };
  }

  const db = client();
  const [appointmentResult, blockedResult] = await Promise.all([
    db
      .from(APPOINTMENTS_TABLE)
      .select("scheduled_date,scheduled_time,status")
      .in("status", [...BOOKING_ACTIVE])
      .not("scheduled_date", "is", null),
    db.from(BLOCKED_TABLE).select("*"),
  ]);
  if (appointmentResult.error) throw new Error(appointmentResult.error.message);
  if (blockedResult.error) throw new Error(blockedResult.error.message);
  const bookedSet = new Set(
    (appointmentResult.data || []).map((row) => `${row.scheduled_date}_${normalizedDbTime(row.scheduled_time)}`),
  );
  const blockedSlots = (blockedResult.data || []).map(blockedFromRow);
  const blockedSet = new Set();
  const blockedDays = new Set();
  blockedSlots.forEach((slot) => {
    if (slot.time === "all") blockedDays.add(slot.date);
    else blockedSet.add(`${slot.date}_${slot.time}`);
  });
  return { bookedSet, blockedSet, blockedDays, blockedSlots };
}

export async function createManualAppointment({
  customerName = "",
  phone = "",
  service = "",
  vehicle = "",
  notes = "",
  scheduledDate,
  scheduledTime,
}) {
  const date = normalizeText(scheduledDate, 10);
  const time = normalizeText(scheduledTime, 5);
  const required = {
    customerName: normalizeText(customerName, 60),
    phone: normalizeText(phone, 40),
    service: normalizeText(service, 80),
    vehicle: normalizeText(vehicle, 120),
  };
  if (Object.values(required).some((value) => !value)) {
    throw Object.assign(new Error("Name, phone, service, and vehicle are required."), { code: "missing_fields" });
  }
  if (!date || !time) throw Object.assign(new Error("Date and time are required."), { code: "missing_fields" });
  if (!validDateString(date)) throw Object.assign(new Error("Invalid date."), { code: "invalid_date" });
  if (!validTimeString(time)) throw Object.assign(new Error("Invalid time."), { code: "invalid_time" });

  const slotValidation = validateShopSlot(date, time, { maxDays: 365, allowPast: false });
  if (!slotValidation.ok) {
    throw Object.assign(new Error(slotValidation.message), { code: slotValidation.code });
  }

  const timestamp = nowIso();
  const sessionId = `manual_${randomUUID()}`;

  const lead = {
    id: stableId("lead"),
    sessionId,
    source: "Manual",
    lang: "en",
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
    appointmentRequested: true,
    summary: normalizeText([service && `Service: ${service}`, vehicle && `Vehicle: ${vehicle}`, notes && `Notes: ${notes}`].filter(Boolean).join(" | "), 500),
    customerName: required.customerName,
    phone: required.phone,
    vehicle: required.vehicle,
    tireSize: "",
    service: required.service,
    preferredDate: "",
    preferredTime: "",
    preferredTimeText: "",
    lastMessage: "",
    assistantMessage: "",
    transcript: [],
    notificationStatus: NOTIFICATION_STATUSES.NOT_READY,
    notificationAttempts: 0,
    notificationLastAttemptAt: "",
    notificationSentAt: "",
    notificationLastErrorCode: "",
  };

  const appointment = {
    id: stableId("appt"),
    leadId: lead.id,
    sessionId,
    status: "confirmed",
    createdAt: timestamp,
    updatedAt: timestamp,
    customerName: lead.customerName,
    phone: lead.phone,
    service: lead.service,
    vehicle: lead.vehicle,
    preferredDate: date,
    preferredTime: time,
    preferredTimeText: "",
    notes: normalizeText([lead.service && `Service: ${lead.service}`, lead.vehicle && `Vehicle: ${lead.vehicle}`, notes && `Notes: ${notes}`].filter(Boolean).join(" | "), 6000),
    scheduledDate: date,
    scheduledTime: time,
  };

  if (!recordsStoreConfigured()) {
    const blocked = devMemory.blockedSlots.some((slot) => slot.date === date && (slot.time === "all" || slot.time === time));
    if (blocked) throw Object.assign(new Error("That time slot is blocked."), { code: "CHAT_RESERVATION_BLOCKED" });
    const conflict = devMemory.appointments.some(
      (item) => item.scheduledDate === date && item.scheduledTime === time && BOOKING_ACTIVE.has(item.status),
    );
    if (conflict) throw Object.assign(new Error("That time slot is already booked."), { code: "CHAT_RESERVATION_CONFLICT" });
  } else {
    const { data: blockedRows } = await client()
      .from(BLOCKED_TABLE)
      .select("id")
      .eq("slot_date", date)
      .or(`and(is_all_day.eq.true),and(is_all_day.eq.false,slot_time.eq.${time})`)
      .limit(1);
    if (blockedRows?.length) throw Object.assign(new Error("That time slot is blocked."), { code: "CHAT_RESERVATION_BLOCKED" });
    const { data: conflictRows } = await client()
      .from(APPOINTMENTS_TABLE)
      .select("id")
      .eq("scheduled_date", date)
      .eq("scheduled_time", time)
      .in("status", [...BOOKING_ACTIVE])
      .limit(1);
    if (conflictRows?.length) throw Object.assign(new Error("That time slot is already booked."), { code: "CHAT_RESERVATION_CONFLICT" });
  }

  const savedLead = await persistLead(lead, null);
  const savedAppointment = await persistAppointment(appointment, null);

  return { ok: true, persisted: recordsStoreConfigured(), lead: savedLead, appointment: savedAppointment };
}
