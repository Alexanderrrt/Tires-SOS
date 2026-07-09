import { createClient } from "@supabase/supabase-js";

const TABLE = "pricing";
const ROW_ID = 1;
const LEADS_FIELD = "chatLeads";
const APPOINTMENTS_FIELD = "appointments";
const MAX_LEADS = 120;
const MAX_APPOINTMENTS = 120;
const MAX_MESSAGES = 18;

const LEAD_STATUSES = new Set(["new", "contacted", "booked", "done", "lost"]);
const APPOINTMENT_STATUSES = new Set(["requested", "confirmed", "completed", "no-show", "canceled"]);

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

function transcriptText(messages) {
  return messages.map((message) => message.content).join("\n").toLowerCase();
}

function latestUserText(messages) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function extractPhone(text) {
  const match = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? normalizeText(match[0], 40) : "";
}

function extractName(text) {
  const patterns = [
    /\bmy name is\s+([a-z][a-z\s.'-]{1,40})/i,
    /\bname is\s+([a-z][a-z\s.'-]{1,40})/i,
    /\bme llamo\s+([a-záéíóúñ][a-záéíóúñ\s.'-]{1,40})/i,
    /\bsoy\s+([a-záéíóúñ][a-záéíóúñ\s.'-]{1,40})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return normalizeText(match[1], 60);
  }
  return "";
}

function extractTireSize(text) {
  const match = text.match(/\b(?:P|LT)?\d{3}\/\d{2}(?:[Rr]|\/)\d{2}\b/);
  return match ? normalizeText(match[0].toUpperCase(), 24) : "";
}

function extractVehicle(text) {
  const match = text.match(/\b((?:19|20)\d{2}\s+[a-z0-9][a-z0-9\s-]{1,42})/i);
  return match ? normalizeText(match[1], 70) : "";
}

function detectService(text) {
  const checks = [
    [/(\btire|\btires|\bllanta|\bllantas|tire size|medida)/i, "Tires"],
    [/(flat|patch|plug|ponchad|reparaci[oó]n de llanta)/i, "Flat repair"],
    [/(brake|brakes|freno|frenos)/i, "Brakes"],
    [/(alignment|alineaci[oó]n)/i, "Alignment"],
    [/(oil change|aceite)/i, "Oil change"],
    [/(battery|bater[ií]a)/i, "Battery"],
    [/(rim|wheel|rin|rines)/i, "Rims / wheels"],
  ];
  return checks.find(([pattern]) => pattern.test(text))?.[1] || "";
}

function detectTiming(text) {
  const match =
    text.match(/\b(today|tomorrow|this morning|this afternoon|tonight|asap|now|morning|afternoon|evening)\b/i) ||
    text.match(/\b(hoy|mañana|manana|esta tarde|esta mañana|esta manana|ahora|urgente)\b/i) ||
    text.match(/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i) ||
    text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i) ||
    text.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  return match ? normalizeText(match[0], 80) : "";
}

function wantsAppointment(text) {
  return /(appointment|book|booking|schedule|come in|drop off|cita|agendar|programar|reservar|puedo ir|pasar)/i.test(text);
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

  const fullText = transcriptText(cleanMessages);
  const newest = latestUserText(cleanMessages);
  if (!hasLeadSignal(fullText, context)) return { captured: false };

  const timestamp = nowIso();
  const fields = {
    customerName: extractName(fullText),
    phone: extractPhone(fullText),
    vehicle: extractVehicle(fullText),
    tireSize: extractTireSize(fullText),
    service: detectService(fullText),
    preferredTime: detectTiming(fullText),
  };
  const appointmentRequested = wantsAppointment(fullText) || Boolean(fields.preferredTime);
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
