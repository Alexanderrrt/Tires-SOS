import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import { sendWhatsAppText, whatsappConfigured } from "../../../../lib/whatsapp-client";
import { getWhatsAppConversation, listWhatsAppConversations, saveOutboundWhatsAppMessage, setWhatsAppBotEnabled } from "../../../../lib/whatsapp-store";

async function authorized() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try { return Response.json({ conversations: await listWhatsAppConversations(), configured: whatsappConfigured() }); }
  catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!(await authorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
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
    const { conversationId, botEnabled } = await request.json();
    await setWhatsAppBotEnabled(conversationId, botEnabled);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
