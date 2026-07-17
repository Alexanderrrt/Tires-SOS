import { createHmac, timingSafeEqual } from "node:crypto";
import { saveInboundWhatsAppMessage } from "../../../../lib/whatsapp-store";
import { saveOutboundWhatsAppMessage } from "../../../../lib/whatsapp-store";
import { sendWhatsAppText } from "../../../../lib/whatsapp-client";
import { callGroqChat, groqReplyText } from "../../../../lib/groq-client";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(rawBody, signature) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const names = new Map((value.contacts || []).map((c) => [c.wa_id, c.profile?.name]));
      for (const message of value.messages || []) {
        const body = message.text?.body;
        if (message.id && message.from && body) {
          const conversation = await saveInboundWhatsAppMessage({ messageId: message.id, waId: message.from, customerName: names.get(message.from), body });
          if (conversation.bot_enabled) {
            const ai = await callGroqChat([
              { role: "system", content: "You are the bilingual WhatsApp assistant for Tires SOS Rescue in San Jose. Reply in the customer's language. Be warm, concise, and helpful. Never invent prices, availability, or policies. For exact quotes or appointments, collect the service, vehicle year/make/model, and customer name, then say the shop team will confirm. Do not claim a booking is confirmed." },
              { role: "user", content: body },
            ], { maxTokens: 220, temperature: 0.25 });
            const reply = groqReplyText(ai);
            if (reply) {
              const sent = await sendWhatsAppText(message.from, reply);
              await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: reply });
            }
          }
        }
      }
    }
  }
  return Response.json({ ok: true });
}
