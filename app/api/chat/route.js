import { SERVICES, SITE } from "../../site.config";
import { getChatSettings } from "../../../lib/chat-settings-store";
import { captureChatRecord } from "../../../lib/chat-records-store";

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
- For appointment requests, follow this STRICT priority order:
  1. First get the SERVICE needed and VEHICLE info.
  2. Then ask for their NAME and PHONE NUMBER — these are required before scheduling.
  3. Only AFTER you have name and phone, say exactly: "Let me pull up available times for you." — this exact phrase triggers the appointment picker in the chat UI. Do NOT ask them to pick a date/time yourself.
- Do not promise a confirmed appointment slot. Say the shop team will confirm the exact time.
- If the customer asks for hours or address, answer clearly and directly.
- Keep answers short by default unless the user asks for detail.
- If the customer writes in Spanish, answer in Spanish. When triggering the picker in Spanish, say exactly: "Déjame mostrarte los horarios disponibles."
- If the customer writes in English, answer in English.
- Never invent business facts. When unsure, say you need to confirm at the shop.
- Never ask open-ended "when would you like to come in?" questions. Once you have name and phone, trigger the picker.

Tone:
- Friendly, like a helpful front-desk person.
- Never robotic, never overly formal.
- Light humor is okay if it feels natural.
`.trim();

const QUOTE_PROMPT = `
This conversation is happening on the quote page.
Your job is to start a useful quote lead for the shop team.

For quote requests, collect details in this STRICT priority order (one at a time):
1. Service needed and quantity (especially for tires)
2. Vehicle year, make, and model
3. Tire size if relevant
4. NAME and PHONE NUMBER — these are required before anything else
5. Only AFTER you have name and phone, say exactly: "Let me pull up available times for you." (or in Spanish: "Déjame mostrarte los horarios disponibles.") — this triggers the appointment picker UI. Do NOT ask when they want to come in yourself.

Do not ask for all details at once.
If they ask for price, give a careful ballpark only when the service is simple. Otherwise say the shop will confirm after checking the vehicle.
Never ask open-ended scheduling questions like "when would you like to come in?" — the picker handles that.
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

  return Response.json({
    model: DEFAULT_MODEL,
    message: content,
  });
}
