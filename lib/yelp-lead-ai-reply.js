import { SITE, SERVICES } from "../app/site.config";
import { callGroqChat, groqReplyText, groqConfigured } from "./groq-client";
import { getStoreContact } from "./store-contact.js";

function buildBusinessFacts(store) {
  return [
    `Business listing: ${store.businessName}`,
    `Phone: ${store.phone}`,
    `Address: ${store.full}`,
    `Directions: ${store.mapsHref}`,
    `Website: ${SITE.url}`,
    `Hours: ${SITE.hours
      .map((hour) => `${hour.label.en}: ${hour.open && hour.close ? `${hour.open}-${hour.close}` : "Closed"}`)
      .join("; ")}`,
    `Services: ${SERVICES.map((service) => `${service.title.en} / ${service.title.es}`).join(", ")}`,
  ].join("\n");
}

function systemPrompt(businessFacts) {
  return `
You are writing a first-reply email on behalf of Tires SOS Rescue, a bilingual tire & auto repair shop serving San Jose and Hayward, CA, to a customer who submitted a Yelp "Request a Quote" lead.
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
${businessFacts}
`.trim();
}

/**
 * @param {{ customerMessage: string, customerName?: string, storeId?: string }} lead
 * @returns {Promise<string>} plain-text reply body, or "" if the AI reply could not be generated.
 */
export async function generateYelpLeadReply({ customerMessage, customerName, storeId }) {
  if (!groqConfigured()) return "";
  const businessFacts = buildBusinessFacts(getStoreContact(storeId));

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
      { role: "system", content: systemPrompt(businessFacts) },
      { role: "user", content: userContent },
    ],
    { maxTokens: 300, temperature: 0.4, timeoutMs: 25_000, backoffMs: 3_000 },
  );

  if (result.error) return "";
  return groqReplyText(result);
}
