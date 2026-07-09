import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PRICING } from "./pricing.default";

// Pricing persistence. Uses Supabase (service-role key, server-side only) when
// configured; otherwise falls back to the bundled default for reads and an
// in-memory copy for writes so the whole flow works in dev without keys.

const TABLE = "pricing";
const ROW_ID = 1;

let devMemory = null; // dev-only in-memory store when Supabase isn't configured

const stripBom = (s) => (typeof s === "string" ? s.replace(/^﻿/, "") : s);

export function storeConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(
    stripBom(process.env.SUPABASE_URL),
    stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false } },
  );
}

// A stored document is only usable if it has the core shape; otherwise
// (e.g. the empty seed row) fall back to the bundled defaults.
function isValidPricing(p) {
  return p && Array.isArray(p.services) && Array.isArray(p.vehicleClasses) && p.services.length > 0;
}

function withoutPrivateSettings(stored) {
  if (!stored || typeof stored !== "object") return stored;
  const { chatSettings, ...pricing } = stored;
  return pricing;
}

// Services shipped in a code update won't exist in an older stored document.
// Append any defaults the stored doc is missing (by id) so new services show
// up without discarding admin-edited prices. Keeps the stored doc's order.
function mergeNewDefaults(stored) {
  const pricing = withoutPrivateSettings(stored);
  const have = new Set(pricing.services.map((s) => s.id));
  const missing = DEFAULT_PRICING.services.filter((s) => !have.has(s.id));
  if (!missing.length) return pricing;
  return { ...pricing, services: [...pricing.services, ...missing] };
}

export async function getPricing() {
  if (!storeConfigured()) {
    return devMemory || DEFAULT_PRICING;
  }
  try {
    const { data, error } = await client().from(TABLE).select("data").eq("id", ROW_ID).single();
    if (error || !isValidPricing(data?.data)) return DEFAULT_PRICING;
    return mergeNewDefaults(data.data);
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function setPricing(pricing) {
  if (!storeConfigured()) {
    devMemory = pricing; // non-persistent, dev only
    return { ok: true, persisted: false };
  }
  const db = client();
  let dataToSave = pricing;

  try {
    const { data } = await db.from(TABLE).select("data").eq("id", ROW_ID).single();
    if (data?.data?.chatSettings) {
      dataToSave = { ...pricing, chatSettings: data.data.chatSettings };
    }
  } catch {
    // Saving pricing should still work if the optional preservation read fails.
  }

  const { error } = await db
    .from(TABLE)
    .upsert({ id: ROW_ID, data: dataToSave, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ok: true, persisted: true };
}
