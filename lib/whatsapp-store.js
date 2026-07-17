import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function saveInboundWhatsAppMessage({ messageId, waId, customerName, body }) {
  const client = db();
  const { data: conversation, error: conversationError } = await client
    .from("whatsapp_conversations")
    .upsert({ wa_id: waId, customer_name: customerName || null, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "wa_id" })
    .select("id,bot_enabled")
    .single();
  if (conversationError) throw conversationError;
  const { error } = await client.from("whatsapp_messages").upsert({
    meta_message_id: messageId,
    conversation_id: conversation.id,
    direction: "inbound",
    body,
    status: "received",
  }, { onConflict: "meta_message_id", ignoreDuplicates: true });
  if (error) throw error;
  return conversation;
}

export async function listWhatsAppConversations() {
  const { data, error } = await db().from("whatsapp_conversations")
    .select("id,wa_id,customer_name,bot_enabled,last_message_at,whatsapp_messages(id,direction,body,status,created_at)")
    .order("last_message_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id, waId: row.wa_id, customerName: row.customer_name, botEnabled: row.bot_enabled,
    lastMessageAt: row.last_message_at,
    messages: (row.whatsapp_messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((m) => ({
      id: m.id, direction: m.direction, body: m.body, status: m.status, createdAt: m.created_at,
    })),
  }));
}

export async function getWhatsAppConversation(id) {
  const { data, error } = await db().from("whatsapp_conversations").select("id,wa_id,bot_enabled").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function getRecentWhatsAppMessages(conversationId, limit = 16) {
  const { data, error } = await db().from("whatsapp_messages")
    .select("direction,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 16, 1), 30));
  if (error) throw error;
  return (data || []).reverse().map((message) => ({
    role: message.direction === "outbound" ? "assistant" : "user",
    content: message.body,
  }));
}

export async function saveOutboundWhatsAppMessage({ conversationId, messageId, body }) {
  const { error } = await db().from("whatsapp_messages").insert({
    meta_message_id: messageId || null, conversation_id: conversationId, direction: "outbound", body, status: "sent",
  });
  if (error) throw error;
}

export async function setWhatsAppBotEnabled(id, enabled) {
  const { error } = await db().from("whatsapp_conversations").update({ bot_enabled: Boolean(enabled), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
