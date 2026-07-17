import { createHmac, timingSafeEqual } from "node:crypto";
import { getRecentWhatsAppMessages, getWhatsAppGlobalBotEnabled, saveInboundWhatsAppMessage, saveOutboundWhatsAppMessage, setWhatsAppBookingState, setWhatsAppBotEnabled } from "../../../../lib/whatsapp-store";
import { sendWhatsAppText } from "../../../../lib/whatsapp-client";
import { sendWhatsAppHandoffEmail } from "../../../../lib/whatsapp-handoff";
import { callGroqChat, groqReplyText } from "../../../../lib/groq-client";
import { captureChatRecord, extractChatFields, getAppointmentBySession, getLeadBySession, reserveAppointment, updateRecordStatus } from "../../../../lib/chat-records-store";
import { formatWhatsAppSlots, nextWhatsAppAppointmentSlots } from "../../../../lib/whatsapp-booking";
import { detectWhatsAppHandoff, detectWhatsAppLanguage, hasWhatsAppAppointmentIntent, hasWhatsAppCancellationIntent, hasWhatsAppRescheduleIntent, nextWhatsAppBookingQuestion, whatsAppGreetingReply, whatsAppStaleSlotReply } from "../../../../lib/whatsapp-workflow";

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
            // A reset creates a new conversation row. Include that row's id in the
            // fallback so a new customer can never inherit the prior phone owner's
            // lead, appointment, name, or offered times.
            const sessionId = conversation.lead_session_id || `whatsapp_${message.from}_${conversation.id}`;
            const fieldsBeforeReply = extractChatFields(workflowHistory);
            const leadBeforeReply = await getLeadBySession(sessionId);
            const bookingFieldsBeforeReply = {
              ...fieldsBeforeReply,
              service: fieldsBeforeReply.service || leadBeforeReply?.service || "",
              vehicle: fieldsBeforeReply.vehicle || leadBeforeReply?.vehicle || "",
              customerName: fieldsBeforeReply.customerName || leadBeforeReply?.customerName || "",
            };
            const appointmentBeforeReply = await getAppointmentBySession(sessionId);
            const appointmentConfirmed = Boolean(
              appointmentBeforeReply?.status === "confirmed"
              && appointmentBeforeReply?.scheduledDate
              && appointmentBeforeReply?.scheduledTime,
            );
            const handoff = detectWhatsAppHandoff(workflowHistory, { appointmentConfirmed });
            if (handoff.shouldHandoff) {
              await setWhatsAppBotEnabled(conversation.id, false);
              try {
                await sendWhatsAppHandoffEmail({
                  conversationId: conversation.id,
                  waId: message.from,
                  customerName: conversation.customer_name || names.get(message.from),
                  reason: handoff.reason,
                  history: workflowHistory,
                  lead: leadBeforeReply,
                });
              } catch (error) {
                await setWhatsAppBotEnabled(conversation.id, true).catch(() => {});
                console.error("WhatsApp handoff email failed; the bot remains active.", error);
                const fallbackReply = lang === "es"
                  ? "Sigo aquí contigo. No pude avisar al equipo por correo en este momento; si necesitas atención inmediata, llama al (408) 332-8962. Puedes seguir escribiéndome mientras tanto."
                  : "I'm still here with you. I couldn't notify the team by email right now; for immediate help, call (408) 332-8962. You can keep messaging me in the meantime.";
                try {
                  const sent = await sendWhatsAppText(message.from, fallbackReply);
                  await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: fallbackReply });
                } catch (sendError) {
                  console.error("WhatsApp handoff fallback reply failed.", sendError);
                }
                continue;
              }
              const handoffReply = lang === "es"
                ? "Claro. Ya avisé al equipo de Tires SOS Rescue para que una persona continúe contigo por este chat. El asistente automático queda en pausa."
                : "Of course. I notified the Tires SOS Rescue team so a person can continue with you in this chat. The automated assistant is now paused.";
              try {
                const sent = await sendWhatsAppText(message.from, handoffReply);
                await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: handoffReply });
              } catch (error) {
                console.error("WhatsApp handoff confirmation failed after the email alert was sent.", error);
              }
              continue;
            }
            if (appointmentConfirmed && hasWhatsAppCancellationIntent(body)) {
              await updateRecordStatus("appointment", appointmentBeforeReply.id, "canceled");
              await setWhatsAppBookingState(conversation.id, { offeredSlots: [], leadSessionId: sessionId, appointmentId: null });
              const reply = lang === "es"
                ? `Tu cita del ${appointmentBeforeReply.scheduledDate} a las ${appointmentBeforeReply.scheduledTime} fue cancelada.`
                : `Your appointment on ${appointmentBeforeReply.scheduledDate} at ${appointmentBeforeReply.scheduledTime} has been canceled.`;
              const sent = await sendWhatsAppText(message.from, reply);
              await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: reply });
              continue;
            }
            const bookingReadyBeforeReply = Boolean(
              leadBeforeReply?.appointmentRequested
              && bookingFieldsBeforeReply.service
              && bookingFieldsBeforeReply.vehicle
              && bookingFieldsBeforeReply.customerName
              && leadBeforeReply.phone,
            );
            if (offeredSlots.length && choice && !offeredSlots[Number(choice[1]) - 1]) {
              const reply = lang === "es"
                ? `Esa opción no es válida. Responde con un número del 1 al ${offeredSlots.length}.`
                : `That option isn't valid. Reply with a number from 1 to ${offeredSlots.length}.`;
              const sent = await sendWhatsAppText(message.from, reply);
              await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: reply });
              continue;
            }
            if (appointmentConfirmed && offeredSlots.length && choice) {
              const slot = offeredSlots[Number(choice[1]) - 1];
              if (slot) {
                const reservation = await reserveAppointment(appointmentBeforeReply?.id || sessionId, slot.date, slot.time);
                const confirmation = lang === "es"
                  ? `Listo, tu cita fue reprogramada para ${slot.date} a las ${slot.time}.`
                  : `Your appointment has been rescheduled for ${slot.date} at ${slot.time}.`;
                const sent = await sendWhatsAppText(message.from, confirmation);
                await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: confirmation });
                await setWhatsAppBookingState(conversation.id, { offeredSlots: [], leadSessionId: sessionId, appointmentId: reservation.appointment?.id || appointmentBeforeReply?.id });
                continue;
              }
            }
            if (!appointmentConfirmed && offeredSlots.length && choice && bookingReadyBeforeReply) {
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
            if (appointmentConfirmed && hasWhatsAppRescheduleIntent(body)) {
              const slots = await nextWhatsAppAppointmentSlots();
              const reply = slots.length
                ? formatWhatsAppSlots(slots, lang)
                : (lang === "es" ? "No hay otros horarios disponibles en los próximos 7 días. Puedes pedir un representante aquí o llamar al (408) 332-8962." : "There are no other times available in the next 7 days. You can ask for a representative here or call (408) 332-8962.");
              await setWhatsAppBookingState(conversation.id, { offeredSlots: slots, leadSessionId: sessionId, appointmentId: appointmentBeforeReply?.id });
              const sent = await sendWhatsAppText(message.from, reply);
              await saveOutboundWhatsAppMessage({ conversationId: conversation.id, messageId: sent.messages?.[0]?.id, body: reply });
              continue;
            }
            const bookingQuestion = !appointmentConfirmed && (leadBeforeReply?.appointmentRequested || hasWhatsAppAppointmentIntent(workflowHistory))
              ? nextWhatsAppBookingQuestion(bookingFieldsBeforeReply, lang, body)
              : "";
            let reply = bookingQuestion || whatsAppGreetingReply(body, lang) || whatsAppStaleSlotReply(body, offeredSlots, lang);
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
- If the customer describes an unknown vehicle noise, vibration, squeal, knock, or similar mechanical symptom, treat the requested service as a diagnostic inspection, acknowledge the symptom, and continue to the vehicle details. Do not repeatedly ask them to name a repair.
- A question such as "Which oil change?" or a statement that you do not know the service is a correction, not service confirmation. Briefly apologize and ask neutrally for the service.
- Do not ask about trim, engine, oil type, viscosity, tire size, quantity, or unrelated services.
- Once service, vehicle year/make/model, and name are known, summarize them in one short sentence and say the shop team will confirm the appointment time shortly.
- If numbered appointment times were already offered and the customer does not reply with a number, answer their latest question or correction without repeating the time list.
- Never claim the appointment is confirmed and never invent availability, prices, dates, or times.

STYLE
- Maximum 3 short sentences. Warm, direct, natural. No long explanations, parenthetical translations, or repetitive sales language.` },
              ...(appointmentConfirmed ? [{ role: "system", content: `The customer's appointment is already confirmed for ${appointmentBeforeReply.scheduledDate} at ${appointmentBeforeReply.scheduledTime}. Do not offer or request another time unless the customer explicitly asks to reschedule or book a separate appointment. If they ask whether they have an appointment, confirm this exact date and time.` }] : []),
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
            const confirmedService = confirmedFields.service || lead?.service;
            const confirmedVehicle = confirmedFields.vehicle || lead?.vehicle;
            const confirmedName = confirmedFields.customerName || lead?.customerName;
            let finalReply = reply;
            if (!appointmentConfirmed && lead?.appointmentRequested && confirmedService && confirmedVehicle && confirmedName && lead.phone) {
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
