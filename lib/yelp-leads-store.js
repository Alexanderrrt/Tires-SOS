import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

let client;

function supabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase Yelp lead storage is not configured.");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function listRecentYelpLeads(limit = 100) {
  const { data, error } = await supabase()
    .from("yelp_leads")
    .select("id,gmail_message_id,sender_email,customer_name,customer_message,ai_reply,status,created_at,replied_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 200));
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    gmailMessageId: row.gmail_message_id,
    senderEmail: row.sender_email,
    customerName: row.customer_name,
    customerMessage: row.customer_message,
    aiReply: row.ai_reply,
    status: row.status,
    createdAt: row.created_at,
    repliedAt: row.replied_at,
  }));
}

export async function findYelpLeadByGmailMessageId(gmailMessageId) {
  const { data, error } = await supabase()
    .from("yelp_leads")
    .select("id,status")
    .eq("gmail_message_id", gmailMessageId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function insertPendingYelpLead({ gmailMessageId, senderEmail, customerName, customerMessage }) {
  const row = {
    id: randomUUID(),
    gmail_message_id: gmailMessageId,
    sender_email: senderEmail || null,
    customer_name: customerName || null,
    customer_message: customerMessage,
    status: "pending",
  };
  const { data, error } = await supabase()
    .from("yelp_leads")
    .insert(row)
    .select("id,gmail_message_id,status")
    .single();
  if (error) throw error;
  return data;
}

export async function markYelpLeadReplied(id, aiReply) {
  const { data, error } = await supabase()
    .from("yelp_leads")
    .update({ status: "replied", ai_reply: aiReply, replied_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function markYelpLeadFailed(id, aiReply = null) {
  const { data, error } = await supabase()
    .from("yelp_leads")
    .update({ status: "failed", ai_reply: aiReply })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Returns the last-checked-at watermark (ms since epoch), or null if this is
 * the very first run (no row yet / never updated) — callers should treat
 * null as "only messages from this moment forward", not "everything".
 */
export async function getResponderWatermark() {
  const { data, error } = await supabase()
    .from("yelp_responder_state")
    .select("last_checked_at")
    .eq("id", "singleton")
    .maybeSingle();
  if (error) throw error;
  return data?.last_checked_at ? new Date(data.last_checked_at).getTime() : null;
}

export async function setResponderWatermark(dateMs) {
  const { error } = await supabase()
    .from("yelp_responder_state")
    .upsert({ id: "singleton", last_checked_at: new Date(dateMs).toISOString(), updated_at: new Date().toISOString() });
  if (error) throw error;
}

const GMAIL_COOLDOWN_STATE_ID = "gmail-cooldown";

/** Shared across Vercel workers so dashboard and cron calls respect one lockout. */
export async function getGmailCooldownUntil() {
  const { data, error } = await supabase()
    .from("yelp_responder_state")
    .select("last_checked_at")
    .eq("id", GMAIL_COOLDOWN_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.last_checked_at ? new Date(data.last_checked_at).getTime() : 0;
}

export async function setGmailCooldownUntil(dateMs) {
  const cooldownUntil = Number(dateMs);
  if (!Number.isFinite(cooldownUntil)) return;
  const { error } = await supabase()
    .from("yelp_responder_state")
    .upsert({
      id: GMAIL_COOLDOWN_STATE_ID,
      last_checked_at: new Date(cooldownUntil).toISOString(),
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
