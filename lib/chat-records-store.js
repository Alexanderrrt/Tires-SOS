import { createClient } from "@supabase/supabase-js";
import { notifyLead } from "./lead-notify";

const TABLE = "pricing";
const ROW_ID = 1;
const LEADS_FIELD = "chatLeads";
const APPOINTMENTS_FIELD = "appointments";
const MAX_LEADS = 120;
const MAX_APPOINTMENTS = 120;
const MAX_MESSAGES = 18;

const LEAD_STATUSES = new Set(["new", "contacted", "booked", "done", "lost"]);
const APPOINTMENT_STATUSES = new Set(["requested", "confirmed", "completed", "no-show", "canceled"]);

const VEHICLE_MAKES = [
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
]);

let devMemory = {
  leads: [],
  appointments: [],
};

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
    { auth: { persistSession: false } },
  );
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  if (typeof crypto?.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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

function readFields(data) {
  return {
    leads: Array.isArray(data?.[LEADS_FIELD]) ? data[LEADS_FIELD] : [],
    appointments: Array.isArray(data?.[APPOINTMENTS_FIELD]) ? data[APPOINTMENTS_FIELD] : [],
  };
}

async function readDocument() {
  if (!recordsStoreConfigured()) {
    return {
      document: {
        [LEADS_FIELD]: devMemory.leads,
        [APPOINTMENTS_FIELD]: devMemory.appointments,
      },
      records: devMemory,
    };
  }

  const { data, error } = await client().from(TABLE).select("data").eq("id", ROW_ID).single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  const document = data?.data && typeof data.data === "object" ? data.data : {};
  return { document, records: readFields(document) };
}

async function writeDocument(document) {
  const records = readFields(document);
  if (!recordsStoreConfigured()) {
    devMemory = records;
    return { persisted: false };
  }

  const { error } = await client()
    .from(TABLE)
    .upsert({ id: ROW_ID, data: document, updated_at: nowIso() });
  if (error) throw new Error(error.message);
  return { persisted: true };
}

export async function getChatRecords() {
  try {
    const { records } = await readDocument();
    return {
      leads: records.leads,
      appointments: records.appointments,
    };
  } catch {
    return {
      leads: [],
      appointments: [],
    };
  }
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

function extractPhone(text) {
  const match = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? normalizeText(match[0], 40) : "";
}

function cleanName(value) {
  const withoutPhone = value.replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, "");
  const withoutPrefs = withoutPhone.replace(/\b(whatsapp|text|sms|call|mensaje|llamada|llamar)\b.*$/i, "");
  const candidate = normalizeText(withoutPrefs.replace(/[^a-zA-Z\u00c0-\u017f\s.'-]/g, " "), 60);
  const words = candidate
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^(mi|my|name|nombre|is|es|soy|me|llamo|phone|telefono|numero|number)$/i.test(word));
  if (!words.length || words.length > 4) return "";
  return titleCase(words.join(" "));
}

function extractName(text, messages) {
  const patterns = [
    /\bmy name is\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bname is\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bi am\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bi'm\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bmi nombre es\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bme llamo\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
    /\bsoy\s+([a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return cleanName(match[1]);
  }

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const previous = messages[index - 1];
    const previousText = foldedText(previous?.content || "");
    const askedForName =
      previous?.role === "assistant" &&
      (previousText.includes("name") || previousText.includes("nombre")) &&
      (previousText.includes("phone") || previousText.includes("telefono") || previousText.includes("numero"));
    if (!askedForName) continue;
    const candidate = cleanName(message.content);
    if (candidate && !/^(Yes|Si|Whatsapp|Text|Call)$/i.test(candidate)) return candidate;
  }

  return "";
}

function extractTireSize(text) {
  const match = text.match(/\b(?:P|LT)?\d{3}\/\d{2}(?:[Rr]|\/)\d{2}\b/);
  return match ? normalizeText(match[0].toUpperCase(), 24) : "";
}

function cleanModel(value) {
  return foldedText(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !VEHICLE_STOP_WORDS.has(word))
    .slice(0, 4)
    .join(" ");
}

function extractVehicle(messages) {
  const year = "((?:19|20)\\d{2})";

  for (const message of userMessages(messages)) {
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
        `\\b${year}\\s+(${makePattern})(?:\\s+([a-z0-9][a-z0-9-]*(?:\\s+[a-z0-9][a-z0-9-]*){0,3}))?\\b`,
        "i",
      );
      const yearFirstMatch = text.match(yearFirst);
      if (yearFirstMatch) {
        const model = cleanModel(yearFirstMatch[3] || "");
        return titleCase([make, model, yearFirstMatch[1]].filter(Boolean).join(" "));
      }

      const makeYear = new RegExp(`\\b(${makePattern})\\s+${year}\\b`, "i");
      const makeYearMatch = text.match(makeYear);
      if (makeYearMatch) return titleCase(`${make} ${makeYearMatch[2]}`);
    }
  }

  return "";
}

function detectService(text) {
  const folded = foldedText(text);
  const checks = [
    [/(oil change|cambio de aceite|aceite)/i, "Oil change"],
    [/(flat|patch|plug|ponchad|reparacion de llanta)/i, "Flat repair"],
    [/(\btire\b|\btires\b|\bllanta\b|\bllantas\b|tire size|medida)/i, "Tires"],
    [/(brake|brakes|freno|frenos)/i, "Brakes"],
    [/(alignment|alineacion)/i, "Alignment"],
    [/(battery|bateria)/i, "Battery"],
    [/(rim|wheel|rin|rines)/i, "Rims / wheels"],
  ];
  return checks.find(([pattern]) => pattern.test(folded))?.[1] || "";
}

function detectTiming(text) {
  const folded = foldedText(text);
  const stripped = folded.replace(/(?:p|lt)?\d{3}\/\d{2}(?:r|\/)\d{2}/gi, "");
  const match =
    stripped.match(/\b(today|tomorrow|this morning|this afternoon|tonight|asap|now|morning|afternoon|evening)\b/i) ||
    stripped.match(/\b(hoy|manana|esta tarde|esta manana|ahora|urgente)\b/i) ||
    stripped.match(/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i) ||
    stripped.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i) ||
    stripped.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  return match ? normalizeText(match[0], 80) : "";
}

function wantsAppointment(text) {
  return /(appointment|book|booking|schedule|come in|drop off|cita|agendar|programar|reservar|puedo ir|pasar)/i.test(
    foldedText(text),
  );
}

function hasLeadSignal(text, context) {
  return (
    context === "quote" ||
    wantsAppointment(text) ||
    Boolean(extractPhone(text)) ||
    Boolean(extractTireSize(text)) ||
    Boolean(detectService(text))
  );
}

function summarize(fields, latestText) {
  const parts = [
    fields.service && `Service: ${fields.service}`,
    fields.vehicle && `Vehicle: ${fields.vehicle}`,
    fields.tireSize && `Tire size: ${fields.tireSize}`,
    fields.preferredTime && `Timing: ${fields.preferredTime}`,
    fields.phone && `Phone: ${fields.phone}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : normalizeText(latestText, 220);
}

export async function captureChatRecord({ sessionId, context = "shop", lang = "en", messages = [], assistantMessage = "" }) {
  const cleanMessages = sanitizeMessages(messages);
  if (!cleanMessages.length || !sessionId) return { captured: false };

  const customerText = transcriptText(userMessages(cleanMessages));
  const newest = latestUserText(cleanMessages);
  if (!hasLeadSignal(customerText, context)) return { captured: false };

  const timestamp = nowIso();
  const fields = {
    customerName: extractName(customerText, cleanMessages),
    phone: extractPhone(customerText),
    vehicle: extractVehicle(cleanMessages),
    tireSize: extractTireSize(customerText),
    service: detectService(customerText),
    preferredTime: detectTiming(customerText),
  };
  const appointmentRequested = wantsAppointment(customerText) || Boolean(fields.preferredTime);
  const summary = summarize(fields, newest);

  const { document, records } = await readDocument();
  const existingLead = records.leads.find((lead) => lead.sessionId === sessionId);
  const leadId = existingLead?.id || makeId("lead");
  const lead = {
    id: leadId,
    sessionId,
    source: context === "quote" ? "Quote chat" : "Site chat",
    lang,
    status: existingLead?.status || "new",
    createdAt: existingLead?.createdAt || timestamp,
    updatedAt: timestamp,
    appointmentRequested,
    summary,
    customerName: fields.customerName || existingLead?.customerName || "",
    phone: fields.phone || existingLead?.phone || "",
    vehicle: fields.vehicle || existingLead?.vehicle || "",
    tireSize: fields.tireSize || existingLead?.tireSize || "",
    service: fields.service || existingLead?.service || "",
    preferredTime: fields.preferredTime || existingLead?.preferredTime || "",
    lastMessage: normalizeText(newest, 400),
    assistantMessage: normalizeText(assistantMessage, 700),
    transcript: cleanMessages,
  };

  const otherLeads = records.leads.filter((item) => item.sessionId !== sessionId);
  const leads = [lead, ...otherLeads].slice(0, MAX_LEADS);

  let appointments = records.appointments;
  if (appointmentRequested) {
    const existingAppointment = appointments.find((appointment) => appointment.sessionId === sessionId);
    const appointment = {
      id: existingAppointment?.id || makeId("appt"),
      leadId,
      sessionId,
      status: existingAppointment?.status || "requested",
      createdAt: existingAppointment?.createdAt || timestamp,
      updatedAt: timestamp,
      customerName: lead.customerName,
      phone: lead.phone,
      service: lead.service,
      vehicle: lead.vehicle,
      preferredTime: lead.preferredTime,
      notes: lead.summary,
    };
    appointments = [
      appointment,
      ...appointments.filter((item) => item.sessionId !== sessionId),
    ].slice(0, MAX_APPOINTMENTS);
  }

  const res = await writeDocument({
    ...document,
    [LEADS_FIELD]: leads,
    [APPOINTMENTS_FIELD]: appointments,
  });

  if (!existingLead) {
    try {
      await notifyLead({
        type: context === "quote" ? "QUOTE" : "CHAT",
        name: lead.customerName,
        phone: lead.phone,
        vehicle: lead.vehicle,
        tireSize: lead.tireSize,
        service: lead.service,
        preferredTime: lead.preferredTime,
        message: lead.lastMessage,
      });
    } catch (err) {
      console.error("Lead SMS notification failed:", err);
    }
  }

  return { captured: true, leadId, persisted: res.persisted };
}

export async function updateRecordStatus(type, id, status) {
  const field = type === "appointment" ? APPOINTMENTS_FIELD : LEADS_FIELD;
  const allowed = type === "appointment" ? APPOINTMENT_STATUSES : LEAD_STATUSES;
  if (!allowed.has(status)) throw new Error("Invalid status.");

  const { document, records } = await readDocument();
  const list = type === "appointment" ? records.appointments : records.leads;
  const next = list.map((record) =>
    record.id === id ? { ...record, status, updatedAt: nowIso() } : record,
  );
  if (!next.some((record) => record.id === id)) throw new Error("Record not found.");

  const res = await writeDocument({ ...document, [field]: next });
  return { ok: true, persisted: res.persisted };
}

export async function deleteRecord(type, id) {
  if (type !== "appointment" && type !== "lead") throw new Error("Invalid record type.");

  const { document, records } = await readDocument();
  const timestamp = nowIso();

  if (type === "appointment") {
    const appointments = records.appointments.filter((appointment) => appointment.id !== id);
    if (appointments.length === records.appointments.length) throw new Error("Record not found.");
    const res = await writeDocument({
      ...document,
      [APPOINTMENTS_FIELD]: appointments,
    });
    return {
      ok: true,
      persisted: res.persisted,
      deleted: { type, id, appointmentIds: [id], leadIds: [] },
      updatedAt: timestamp,
    };
  }

  const lead = records.leads.find((item) => item.id === id);
  if (!lead) throw new Error("Record not found.");

  const appointmentsToDelete = records.appointments
    .filter((appointment) => appointment.leadId === id || appointment.sessionId === lead.sessionId)
    .map((appointment) => appointment.id);
  const appointmentIdSet = new Set(appointmentsToDelete);
  const leads = records.leads.filter((item) => item.id !== id);
  const appointments = records.appointments.filter((appointment) => !appointmentIdSet.has(appointment.id));

  const res = await writeDocument({
    ...document,
    [LEADS_FIELD]: leads,
    [APPOINTMENTS_FIELD]: appointments,
  });

  return {
    ok: true,
    persisted: res.persisted,
    deleted: { type, id, leadIds: [id], appointmentIds: appointmentsToDelete },
    updatedAt: timestamp,
  };
}

const BOOKING_ACTIVE = new Set(["requested", "confirmed"]);

export async function scheduleAppointment(id, scheduledDate, scheduledTime) {
  const { document, records } = await readDocument();
  const appointment = records.appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Appointment not found.");

  const conflict = records.appointments.find(
    (a) =>
      a.id !== id &&
      a.scheduledDate === scheduledDate &&
      a.scheduledTime === scheduledTime &&
      BOOKING_ACTIVE.has(a.status),
  );
  if (conflict) throw new Error("Time slot already booked.");

  const updated = {
    ...appointment,
    scheduledDate,
    scheduledTime,
    status: "confirmed",
    updatedAt: nowIso(),
  };

  const appointments = records.appointments.map((a) => (a.id === id ? updated : a));
  const res = await writeDocument({ ...document, [LEADS_FIELD]: records.leads, [APPOINTMENTS_FIELD]: appointments });
  return { ok: true, persisted: res.persisted, appointment: updated };
}

export async function unscheduleAppointment(id) {
  const { document, records } = await readDocument();
  const appointment = records.appointments.find((a) => a.id === id);
  if (!appointment) throw new Error("Appointment not found.");

  const updated = {
    ...appointment,
    scheduledDate: "",
    scheduledTime: "",
    status: "requested",
    updatedAt: nowIso(),
  };

  const appointments = records.appointments.map((a) => (a.id === id ? updated : a));
  const res = await writeDocument({ ...document, [LEADS_FIELD]: records.leads, [APPOINTMENTS_FIELD]: appointments });
  return { ok: true, persisted: res.persisted };
}
