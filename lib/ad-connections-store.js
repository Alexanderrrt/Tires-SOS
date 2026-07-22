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
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TABLE = "ad_connections";
const ROW_ID = 1;

let devMemory = null;

export const PLATFORMS = {
  google_ads: {
    label: "Google Ads",
    fields: [
      { key: "customer_id", label: "Customer ID", secret: false, placeholder: "123-456-7890" },
      { key: "login_customer_id", label: "Manager Account ID (optional)", secret: false, required: false, placeholder: "123-456-7890" },
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

function encryptionKey() {
  const secret = cleanEnv(
    process.env.AD_CONNECTIONS_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.CLERK_SECRET_KEY
  );
  return secret ? createHash("sha256").update(secret).digest() : null;
}

function storeConfigured() {
  return Boolean(
    cleanEnv(process.env.SUPABASE_URL) &&
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    encryptionKey()
  );
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

function encryptConnections(connections) {
  const key = encryptionKey();
  if (!key) throw new Error("AD_CONNECTIONS_ENCRYPTION_KEY is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(normalize(connections)), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decryptConnections(stored) {
  // Backward compatibility: legacy rows were stored as plaintext JSON.
  if (!stored?.ciphertext || stored.version !== 1) return normalize(stored);
  const key = encryptionKey();
  if (!key) return emptyConnections();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(stored.iv, "base64"));
  decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(stored.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return normalize(JSON.parse(plaintext));
}

export async function getAdConnections() {
  if (!storeConfigured()) return normalize(devMemory);
  try {
    const { data, error } = await client().from(TABLE).select("connections").eq("id", ROW_ID).maybeSingle();
    if (error || !data?.connections) return normalize(devMemory);
    return decryptConnections(data.connections);
  } catch {
    return normalize(devMemory);
  }
}

export async function setAdConnections(connections) {
  const clean = normalize(connections);
  devMemory = clean;
  if (!storeConfigured()) {
    return {
      ok: true,
      persisted: false,
      warning: "Supabase or a server-side encryption secret is not configured.",
    };
  }
  try {
    const encrypted = encryptConnections(clean);
    const { error } = await client()
      .from(TABLE)
      .upsert({ id: ROW_ID, connections: encrypted, updated_at: new Date().toISOString() }, { onConflict: "id" });
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
        required: f.required !== false,
        placeholder: f.placeholder || "",
        saved: Boolean(entry.fields[f.key]),
        maskedValue: f.secret ? maskValue(entry.fields[f.key]) : String(entry.fields[f.key] || ""),
      })),
    };
  }
  return out;
}
