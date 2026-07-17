import { createHmac, timingSafeEqual } from "node:crypto";
import { getRecentWhatsAppMessages, getWhatsAppGlobalBotEnabled, saveInboundWhatsAppMessage, saveOutboundWhatsAppMessage, setWhatsAppBookingState } from "../../../../lib/whatsapp-store";
import { sendWhatsAppText } from "../../../../lib/whatsapp-client";
import { callGroqChat, groqReplyText } from "../../../../lib/groq-client";
import { captureChatRecord, extractChatFields, getLeadBySession, reserveAppointment } from "../../../../lib/chat-records-store";
import { formatWhatsAppSlots, nextWhatsAppAppointmentSlots } from "../../../../lib/whatsapp-booking";
import { detectWhatsAppLanguage, hasWhatsAppAppointmentIntent, nextWhatsAppBookingQuestion } from "../../../../lib/whatsapp-workflow";

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
  const globalBotEnabled = await getWhatsAppGlobalBotEnabled().catch(() => false);
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const names = new Map((value.contacts || []).map((c) => [c.wa_id, c.profile?.name]));
      for (const message of value.messages || []) {
        const body = message.text?.body;
        if (message.id && message.from && body) {
          const conversation = await saveInboundWhatsAppMessage({ messageId: message.id, waId: message.from, customerName: names.get(message.from), body });
          if (globalBotEnabled && conversation.bot_enabled) {
            const history = await getRecentWhatsAppMessages(conversation.id, conversation.context_enabled ? 30 : 1);
            const workflowHistory = conversation.context_enabled ? history : await getRecentWhatsAppMessages(conversation.id, 30);
            const lang = detectWhatsAppLanguage(body, workflowHistory);
            const offeredSlots = Array.isArray(conversation.offered_slots) ? conversation.offered_slots : [];
            const choice = body.trim().match(/^([1-9])$/);
            const sessionId = conversation.lead_session_id || `whatsapp_${message.from}`;
            const fieldsBeforeReply = extractChatFields(workflowHistory);
            const leadBeforeReply = await getLeadBySession(sessionId);
            const bookingReadyBeforeReply = Boolean(
              leadBeforeReply?.appointmentRequested
              && fieldsBeforeReply.service
              && fieldsBeforeReply.vehicle
              && fieldsBeforeReply.customerName
              && leadBeforeReply.phone,
            );
            if (offeredSlots.length && choice && bookingReadyBeforeReply) {
              const slot = offeredSlots[Number(choice[1]) - 1];
              if (slot) {
                const reservation = await reserveAppointment(sessionId, slot.date, slot.time);
                const confirmation = lang === "es"
                  ? `Listo, tu cita está confirmada para ${slot.date} a las ${slot.time}. Te esperamos en Tires SOS Rescue.`
                  : `You're booked for ${slot.date} at ${slot.time}. We look forward to seeing you at Tires SOS Rescue.`;
                const sent = await sendWhatsAppText(message.from, confirmation);
                await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: confirmation });
                await setWhatsAppBookingState(conversation.id, { offeredSlots: [], leadSessionId: sessionId, appointmentId: reservation.appointment?.id || null });
                continue;
              }
            }
            const bookingQuestion = (leadBeforeReply?.appointmentRequested || hasWhatsAppAppointmentIntent(workflowHistory))
              ? nextWhatsAppBookingQuestion(fieldsBeforeReply, lang)
              : "";
            let reply = bookingQuestion;
            if (!reply) {
              const ai = await callGroqChat([
              { role: "system", content: `You are the WhatsApp booking assistant for Tires SOS Rescue in San Jose.

LANGUAGE
- Reply only in the language of the customer's MOST RECENT message. English message = English reply. Spanish message = Spanish reply. Never include both languages unless asked.

MEMORY
- Read the full conversation. Remember every detail already provided. Never ask for a detail again.
- Interpret natural phrases correctly. "Solo el cambio de aceite" means "only the oil change"; Solo is not a vehicle make/model.

APPOINTMENT WORKFLOW
- Collect exactly these items, one missing item at a time: (1) service, (2) vehicle year/make/model, (3) customer name.
- If the customer provides multiple items together, accept all of them.
- Never suggest, guess, assume, or give examples of a service the customer has not named. If service is missing, ask only: "What service do you need?" in the customer's language.
- A question such as "Which oil change?" or a statement that you do not know the service is a correction, not service confirmation. Briefly apologize and ask neutrally for the service.
- Do not ask about trim, engine, oil type, viscosity, tire size, quantity, or unrelated services.
- Once service, vehicle year/make/model, and name are known, summarize them in one short sentence and say the shop team will confirm the appointment time shortly.
- If numbered appointment times were already offered and the customer does not reply with a number, answer their latest question or correction without repeating the time list.
- Never claim the appointment is confirmed and never invent availability, prices, dates, or times.

STYLE
- Maximum 3 short sentences. Warm, direct, natural. No long explanations, parenthetical translations, or repetitive sales language.` },
              ...history,
              ], { maxTokens: 150, temperature: 0.15 });
              reply = groqReplyText(ai);
            }
            await captureChatRecord({
              sessionId,
              context: "shop",
              source: "WhatsApp",
              lang,
              messages: [...workflowHistory, { role: "user", content: `My WhatsApp number is +${message.from}` }],
              assistantMessage: reply,
            });
            const lead = await getLeadBySession(sessionId);
            const confirmedFields = extractChatFields(workflowHistory);
            const confirmedService = confirmedFields.service;
            const confirmedVehicle = confirmedFields.vehicle;
            const confirmedName = confirmedFields.customerName;
            let finalReply = reply;
            if (lead?.appointmentRequested && confirmedService && confirmedVehicle && confirmedName && lead.phone) {
              if (offeredSlots.length) {
                await setWhatsAppBookingState(conversation.id, { offeredSlots, leadSessionId: sessionId });
              } else {
                const slots = await nextWhatsAppAppointmentSlots();
                finalReply = slots.length ? formatWhatsAppSlots(slots, lang) : (lang === "es" ? "No hay horarios disponibles en los próximos 7 días. El equipo te contactará." : "There are no available times in the next 7 days. The shop team will contact you.");
                await setWhatsAppBookingState(conversation.id, { offeredSlots: slots, leadSessionId: sessionId });
              }
            } else {
              await setWhatsAppBookingState(conversation.id, { offeredSlots: [], leadSessionId: sessionId });
            }
            if (finalReply) {
              const sent = await sendWhatsAppText(message.from, finalReply);
              await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: finalReply });
            }
          }
        }
      }
    }
  }
  return Response.json({ ok: true });
}
