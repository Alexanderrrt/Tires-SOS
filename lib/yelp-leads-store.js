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
