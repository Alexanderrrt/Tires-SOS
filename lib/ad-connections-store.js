// Store for ad-platform connections (Google Ads, Meta, Yelp). Follows the
// chat-settings-store pattern: Supabase row when configured, in-memory
// fallback for local dev so the dashboard stays usable without a database.
//
// Supabase table (run once in the SQL editor):
//   create table if not exists ad_connections (
//     id int primary key,
//     connections jsonb not null default '{}',
//     updated_at timestamptz
//   );

import { createClient } from "@supabase/supabase-js";

const TABLE = "ad_connections";
const ROW_ID = 1;

let devMemory = null;

export const PLATFORMS = {
  google_ads: {
    label: "Google Ads",
    fields: [
      { key: "customer_id", label: "Customer ID", secret: false, placeholder: "123-456-7890" },
      { key: "developer_token", label: "Developer Token", secret: true },
      { key: "client_id", label: "OAuth Client ID", secret: false, placeholder: "xxxx.apps.googleusercontent.com" },
      { key: "client_secret", label: "OAuth Client Secret", secret: true },
      { key: "refresh_token", label: "Refresh Token", secret: true },
    ],
  },
  meta_ads: {
    label: "Meta Ads",
    fields: [
      { key: "ad_account_id", label: "Ad Account ID", secret: false, placeholder: "act_1234567890" },
      { key: "access_token", label: "System User Access Token", secret: true },
    ],
  },
  yelp: {
    label: "Yelp Ads",
    fields: [
      { key: "business_id", label: "Business ID", secret: false, placeholder: "tires-sos-rescue-san-jose" },
      { key: "api_key", label: "API Key", secret: true },
    ],
  },
};

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^﻿/, "").replace(/^ï»¿/, "").trim();
}

function storeConfigured() {
  return Boolean(cleanEnv(process.env.SUPABASE_URL) && cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY));
}

function client() {
  return createClient(cleanEnv(process.env.SUPABASE_URL), cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY), {
    auth: { persistSession: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

function emptyConnections() {
  const out = {};
  for (const key of Object.keys(PLATFORMS)) {
    out[key] = { connected: false, fields: {}, connectedAt: null };
  }
  return out;
}

function normalize(raw) {
  const base = emptyConnections();
  if (!raw || typeof raw !== "object") return base;
  for (const key of Object.keys(base)) {
    const entry = raw[key];
    if (entry && typeof entry === "object") {
      base[key] = {
        connected: Boolean(entry.connected),
        fields: entry.fields && typeof entry.fields === "object" ? entry.fields : {},
        connectedAt: entry.connectedAt || null,
      };
    }
  }
  return base;
}

export async function getAdConnections() {
  if (!storeConfigured()) return normalize(devMemory);
  try {
    const { data, error } = await client().from(TABLE).select("connections").eq("id", ROW_ID).maybeSingle();
    if (error || !data?.connections) return normalize(devMemory);
    return normalize(data.connections);
  } catch {
    return normalize(devMemory);
  }
}

export async function setAdConnections(connections) {
  const clean = normalize(connections);
  devMemory = clean;
  if (!storeConfigured()) return { ok: true, persisted: false };
  try {
    const { error } = await client()
      .from(TABLE)
      .upsert({ id: ROW_ID, connections: clean, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) return { ok: true, persisted: false, warning: error.message };
    return { ok: true, persisted: true };
  } catch (err) {
    return { ok: true, persisted: false, warning: err.message };
  }
}

function maskValue(value) {
  const str = String(value || "");
  if (!str) return "";
  return str.length > 4 ? `••••${str.slice(-4)}` : "••••";
}

// Public view: never expose raw secrets, only "saved, ends in 1234".
export function maskConnections(connections) {
  const out = {};
  for (const [platform, def] of Object.entries(PLATFORMS)) {
    const entry = connections[platform] || { connected: false, fields: {} };
    out[platform] = {
      connected: entry.connected,
      connectedAt: entry.connectedAt,
      fields: def.fields.map((f) => ({
        key: f.key,
        label: f.label,
        secret: f.secret,
        placeholder: f.placeholder || "",
        saved: Boolean(entry.fields[f.key]),
        maskedValue: f.secret ? maskValue(entry.fields[f.key]) : String(entry.fields[f.key] || ""),
      })),
    };
  }
  return out;
}
