import { createClient } from "@supabase/supabase-js";

const TABLE = "site_launch_settings";
const KEY = "hayward_location_revealed";
let devMemory = null;

function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export function launchStoreConfigured() { return configured(); }

export async function getHaywardRevealed() {
  if (!configured()) return devMemory === true;
  try {
    const { data, error } = await client().from(TABLE).select("value").eq("key", KEY).maybeSingle();
    return !error && data?.value === true;
  } catch { return false; }
}

export async function setHaywardRevealed(value) {
  const revealed = value === true;
  if (!configured()) { devMemory = revealed; return { persisted: false, revealed }; }
  const { error } = await client().from(TABLE).upsert(
    { key: KEY, value: revealed, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
  return { persisted: true, revealed };
}
