import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CHAT_SETTINGS } from "./chat-settings.default";
import { sanitizeChatSettings } from "./chat-settings-validate";

const TABLE = "chat_settings";
const ROW_ID = 1;

let devMemory = null;

function noStoreFetch(input, init = {}) {
  return fetch(input, { ...init, cache: "no-store" });
}

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^\uFEFF/, "").replace(/^\u00ef\u00bb\u00bf/, "");
}

export function chatStoreConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(
    cleanEnv(process.env.SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false }, global: { fetch: noStoreFetch } },
  );
}

function mergeDefaults(settings) {
  return sanitizeChatSettings({ ...DEFAULT_CHAT_SETTINGS, ...(settings || {}) });
}

export async function getChatSettings() {
  if (!chatStoreConfigured()) return devMemory || DEFAULT_CHAT_SETTINGS;

  try {
    const { data, error } = await client()
      .from(TABLE)
      .select("settings")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error || !data?.settings) return DEFAULT_CHAT_SETTINGS;
    return mergeDefaults(data.settings);
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

  const { error } = await client()
    .from(TABLE)
    .upsert({ id: ROW_ID, settings: clean, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { ok: true, persisted: true };
}
