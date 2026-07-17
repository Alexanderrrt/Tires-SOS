import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import { sendWhatsAppMedia, sendWhatsAppText, uploadWhatsAppMedia, whatsappConfigured } from "../../../../lib/whatsapp-client";
import { getWhatsAppConversation, getWhatsAppGlobalBotEnabled, listWhatsAppConversations, resetWhatsAppConversation, saveOutboundWhatsAppMessage, setWhatsAppBotEnabled, setWhatsAppContextEnabled, setWhatsAppGlobalBotEnabled } from "../../../../lib/whatsapp-store";
import { deleteRecord, getLeadBySession } from "../../../../lib/chat-records-store";

async function authorized() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const [conversations, globalBotEnabled] = await Promise.all([listWhatsAppConversations(), getWhatsAppGlobalBotEnabled().catch(() => false)]);
    return Response.json(
      { conversations, globalBotEnabled, configured: whatsappConfigured() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
  catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const conversationId = String(form.get("conversationId") || "");
      const caption = String(form.get("caption") || "").trim();
      const file = form.get("file");
      if (!conversationId || !(file instanceof File) || !file.size) return Response.json({ error: "Conversation and file are required." }, { status: 400 });
      if (file.size > 16 * 1024 * 1024) return Response.json({ error: "Files must be 16 MB or smaller." }, { status: 413 });
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";
      const conversation = await getWhatsAppConversation(conversationId);
      const mediaId = await uploadWhatsAppMedia(file);
      const result = await sendWhatsAppMedia(conversation.wa_id, { mediaId, type, filename: file.name, caption });
      await saveOutboundWhatsAppMessage({ conversationId, messageId: result.messages?.[0]?.id, body: `${type === "image" ? "Image" : "File"}: ${file.name}${caption ? ` — ${caption}` : ""}` });
      return Response.json({ ok: true });
    }
    const { conversationId, body } = await request.json();
    if (!conversationId || !String(body || "").trim()) return Response.json({ error: "Conversation and message are required." }, { status: 400 });
    const conversation = await getWhatsAppConversation(conversationId);
    const result = await sendWhatsAppText(conversation.wa_id, String(body).trim().slice(0, 4096));
    await saveOutboundWhatsAppMessage({ conversationId, messageId: result.messages?.[0]?.id, body: String(body).trim() });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

export async function PATCH(request) {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { conversationId, botEnabled, contextEnabled, action } = await request.json();
    if (action === "global-bot") {
      const enabled = await setWhatsAppGlobalBotEnabled(botEnabled);
      return Response.json({ ok: true, globalBotEnabled: enabled });
    }
    if (!conversationId) return Response.json({ error: "Conversation is required." }, { status: 400 });
    if (action === "context") await setWhatsAppContextEnabled(conversationId, contextEnabled);
    else await setWhatsAppBotEnabled(conversationId, botEnabled);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request) {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { conversationId } = await request.json();
    const { leadSessionId } = await resetWhatsAppConversation(conversationId);
    if (leadSessionId) {
      const lead = await getLeadBySession(leadSessionId).catch(() => null);
      if (lead?.id) await deleteRecord("lead", lead.id);
    }
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
