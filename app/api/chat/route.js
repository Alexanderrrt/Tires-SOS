import { SERVICES, SITE } from "../../site.config";
import { getChatSettings } from "../../../lib/chat-settings-store";
import { captureChatRecord } from "../../../lib/chat-records-store";
import { notifyLead } from "../../../lib/lead-notify";

const notifiedSessions = new Set();

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const BUSINESS_FACTS = [
  `Phone: ${SITE.phone}`,
  `WhatsApp: ${SITE.whatsapp}`,
  `Locations: ${SITE.locations.map((location) => location.full).join("; ")}`,
  `Hours: ${SITE.hours
    .map((hour) => `${hour.label.en}: ${hour.open && hour.close ? `${hour.open}-${hour.close}` : "Closed"}`)
    .join("; ")}`,
  `Services: ${SERVICES.map((service) => `${service.title.en} / ${service.title.es}`).join(", ")}`,
].join("\n");

const SYSTEM_PROMPT = `
You are Tires SOS Rescue's friendly shop assistant.
You sound warm, calm, practical, and easy to talk to.
You help customers in a concise, bilingual way and you can show a little personality.

Focus on:
- tires
- flat repair
- wheel alignment
- brakes
- oil changes
- batteries
- rims
- store hours, location, and walk-in guidance

Behavior:
- Use contractions and natural conversation.
- Start with a quick human acknowledgment when appropriate.
- Ask one clarifying question if the customer's request is vague.
- If the customer asks for pricing, give a helpful range and encourage the quote page or a shop visit.
- If the customer asks for appointment booking, help start an appointment request.
- For appointment requests, collect the next missing detail: service, vehicle, preferred day/time, name, and phone.
- Do not promise a confirmed appointment slot. Say the shop team will confirm the exact time.
- If the customer asks for hours or address, answer clearly and directly.
- Keep answers short by default unless the user asks for detail.
- If the customer writes in Spanish, answer in Spanish.
- If the customer writes in English, answer in English.
- Never invent business facts. When unsure, say you need to confirm at the shop.

Tone:
- Friendly, like a helpful front-desk person.
- Never robotic, never overly formal.
- Light humor is okay if it feels natural.
`.trim();

const QUOTE_PROMPT = `
This conversation is happening on the quote page.
Your job is to start a useful quote lead for the shop team.

For quote requests, collect only the next useful missing detail:
- vehicle year, make, and model
- tire size if they know it
- service needed
- quantity, especially for tires
- when they want to come in
- name and phone number for follow-up

Do not ask for all details at once.
When the customer gives enough information, summarize it clearly and say the shop team will use it to follow up.
If they ask for price, give a careful ballpark only when the service is simple. Otherwise say the shop will confirm after checking the vehicle.
`.trim();

export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const lang = payload?.lang === "es" ? "es" : "en";
  const context = payload?.context === "quote" ? "quote" : "shop";
  const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId.slice(0, 120) : "";
  const chatSettings = context === "quote" ? await getChatSettings() : null;
  const sanitizedMessages = messages
    .filter((message) => message && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.slice(0, 2000),
    }));

  if (!sanitizedMessages.length) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const response = await fetch(GROQ_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}${context === "quote" ? `\n\n${QUOTE_PROMPT}` : ""}${
            chatSettings?.systemInstructions ? `\n\nAdmin chat guidance:\n${chatSettings.systemInstructions}` : ""
          }\n\nBusiness facts:\n${BUSINESS_FACTS}\n\nRespond in ${
            lang === "es" ? "Spanish" : "English"
          } unless the user clearly switches languages.`,
        },
        ...sanitizedMessages,
      ],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.error?.message || data?.error || "Groq request failed.";
    return Response.json({ error: detail }, { status: response.status });
  }

  const content = data?.choices?.[0]?.message?.content?.trim() || "";

  try {
    await captureChatRecord({
      sessionId,
      context,
      lang,
      messages: sanitizedMessages,
      assistantMessage: content,
    });
  } catch (error) {
    console.error("Chat record capture failed:", error);
  }

  try {
    if (!notifiedSessions.has(sessionId)) {
      const userText = sanitizedMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" ");
      const nameMatch = userText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      const phoneMatch = userText.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
      if (nameMatch && phoneMatch) {
        await notifyLead({
          type: context === "quote" ? "QUOTE" : "CHAT",
          name: nameMatch[1],
          phone: phoneMatch[1],
          message: userText.slice(0, 240),
        });
        notifiedSessions.add(sessionId);
      }
    }
  } catch (err) {
    console.error("Lead notification failed:", err);
  }

  return Response.json({
    model: DEFAULT_MODEL,
    message: content,
  });
}
