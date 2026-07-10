import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PRICING } from "./pricing.default";

// Pricing persistence. Uses Supabase (service-role key, server-side only) when
// configured; otherwise falls back to the bundled default for reads and an
// in-memory copy for writes so the whole flow works in dev without keys.

const TABLE = "pricing";
const ROW_ID = 1;

let devMemory = null; // dev-only in-memory store when Supabase is not configured

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^\uFEFF/, "").replace(/^\u00ef\u00bb\u00bf/, "");
}

export function storeConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  return createClient(
    cleanEnv(process.env.SUPABASE_URL),
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
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
  const {
    chatSettings,
    chatLeads,
    appointments,
    blockedSlots,
    notificationOutbox,
    ...pricing
  } = stored;
  return pricing;
}

// Services shipped in a code update will not exist in an older stored document.
// Append any defaults the stored doc is missing (by id) so new services show
// up without discarding admin-edited prices. Keeps the stored doc order.
function mergeNewDefaults(stored) {
  const pricing = withoutPrivateSettings(stored);
  const have = new Set(pricing.services.map((s) => s.id));
  const missingServices = DEFAULT_PRICING.services.filter((s) => !have.has(s.id));
  const merged = missingServices.length
    ? { ...pricing, services: [...pricing.services, ...missingServices] }
    : pricing;
  // Older stored documents predate brand tiers — add the defaults so the
  // admin UI and quote engine have something to work with.
  if (!Array.isArray(merged.brandTiers) || !merged.brandTiers.length) {
    return { ...merged, brandTiers: DEFAULT_PRICING.brandTiers };
  }
  return merged;
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

  const { data, error: readError } = await db.from(TABLE).select("data").eq("id", ROW_ID).single();
  if (readError && readError.code !== "PGRST116") {
    throw new Error(`Could not safely preserve operational data: ${readError.message}`);
  }

  if (data?.data && typeof data.data === "object") {
      const { chatSettings, chatLeads, appointments, blockedSlots, notificationOutbox } = data.data;
      dataToSave = { ...pricing };
      if (chatSettings) dataToSave.chatSettings = chatSettings;
      if (chatLeads) dataToSave.chatLeads = chatLeads;
      if (appointments) dataToSave.appointments = appointments;
      if (blockedSlots) dataToSave.blockedSlots = blockedSlots;
      if (notificationOutbox) dataToSave.notificationOutbox = notificationOutbox;
  }

  const { error } = await db
    .from(TABLE)
    .upsert({ id: ROW_ID, data: dataToSave, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ok: true, persisted: true };
}
