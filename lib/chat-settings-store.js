import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CHAT_SETTINGS } from "./chat-settings.default";
import { sanitizeChatSettings } from "./chat-settings-validate";

// Reuse the existing singleton JSON settings row so production does not need
// a second table or a changed database constraint.
const TABLE = "pricing";
const ROW_ID = 1;
const FIELD = "chatSettings";

let devMemory = null;

const stripBom = (s) => (typeof s === "string" ? s.replace(/^ï»¿/, "") : s);

export function chatStoreConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(
    stripBom(process.env.SUPABASE_URL),
    stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } },
  );
}

function mergeDefaults(settings) {
  return sanitizeChatSettings({ ...DEFAULT_CHAT_SETTINGS, ...(settings || {}) });
}

export async function getChatSettings() {
  if (!chatStoreConfigured()) {
    return devMemory || DEFAULT_CHAT_SETTINGS;
  }

  try {
    const { data, error } = await client().from(TABLE).select("data").eq("id", ROW_ID).single();
    if (error || !data?.data?.[FIELD]) return DEFAULT_CHAT_SETTINGS;
    return mergeDefaults(data.data[FIELD]);
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
}

export async function setChatSettings(settings) {
  const clean = sanitizeChatSettings(settings);
  if (!chatStoreConfigured()) {
    devMemory = clean;
    return { ok: true, persisted: false };
  }

  const db = client();
  let existing = {};

  try {
    const { data } = await db.from(TABLE).select("data").eq("id", ROW_ID).single();
    if (data?.data && typeof data.data === "object") existing = data.data;
  } catch {
    // The upsert below can create the singleton row when the read misses.
  }

  const { error } = await db
    .from(TABLE)
    .upsert({ id: ROW_ID, data: { ...existing, [FIELD]: clean }, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ok: true, persisted: true };
}
