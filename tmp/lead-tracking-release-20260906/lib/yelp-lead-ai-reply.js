import { SITE, SERVICES } from "../app/site.config";
import { callGroqChat, groqReplyText, groqConfigured } from "./groq-client";

const BUSINESS_FACTS = [
  `Phone / WhatsApp: ${SITE.phone}`,
  `Locations: ${SITE.locations.map((location) => location.full).join("; ")}`,
  `Hours: ${SITE.hours
    .map((hour) => `${hour.label.en}: ${hour.open && hour.close ? `${hour.open}-${hour.close}` : "Closed"}`)
    .join("; ")}`,
  `Services: ${SERVICES.map((service) => `${service.title.en} / ${service.title.es}`).join(", ")}`,
].join("\n");

const SYSTEM_PROMPT = `
You are writing a first-reply email on behalf of Tires SOS Rescue, a bilingual tire & auto repair shop in San Jose, CA, to a customer who submitted a Yelp "Request a Quote" lead.
Sound warm, human, and genuinely helpful — like a real front-desk teammate replying quickly to a new customer, not a bot.

Rules:
- Reply in the SAME language the customer wrote in (Spanish or English). If mixed or unclear, reply in English.
- Thank them briefly for reaching out through Yelp.
- Acknowledge the specific service/vehicle detail they mentioned, if any.
- NEVER state a specific price or price range — you don't have access to real-time pricing here. Invite them to  WhatsApp for an exact quote.
- Keep it short: 2-4 sentences, plain text (no markdown, no bullet points, no subject line, no HTML).
- End with a light, natural invitation to reach out tiressosrescue.com to book an automated ai appoiment or stop by , using the business facts below. Do not repeat every business fact — pick what's relevant.
- Never invent business facts beyond what's given below.
- Sign off with a generic "Customer Service Team" — sign as "Tires SOS Rescue".

Business facts:
${BUSINESS_FACTS}
`.trim();

/**
 * @param {{ customerMessage: string, customerName?: string }} lead
 * @returns {Promise<string>} plain-text reply body, or "" if the AI reply could not be generated.
 */
export async function generateYelpLeadReply({ customerMessage, customerName }) {
  if (!groqConfigured()) return "";

  const userContent = [
    customerName ? `Customer name: ${customerName}` : null,
    `Customer's Yelp message:\n${customerMessage.slice(0, 4000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Not latency-sensitive (runs off a 5-minute cron, not a live user), so it
  // can afford to wait out a brief rate-limit window on the primary model
  // before falling back to a different model.
  const result = await callGroqChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    { maxTokens: 300, temperature: 0.4, timeoutMs: 25_000, backoffMs: 3_000 },
  );

  if (result.error) return "";
  return groqReplyText(result);
}
