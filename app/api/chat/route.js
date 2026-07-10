import { SERVICES, SITE } from "../../site.config";
import { getChatSettings } from "../../../lib/chat-settings-store";
import { captureChatRecord } from "../../../lib/chat-records-store";
import { compactPricingContext } from "../../../lib/chat-pricing-context";
import { getPricing } from "../../../lib/pricing-store";
import {
  buildPriceEstimateTool,
  runPriceEstimateTool,
  renderDeterministicEstimate,
  replyMatchesComputedRange,
} from "../../../lib/chat-price-tool";
import {
  CHAT_SESSION_COOKIE,
  chatSessionConfigured,
  turnstileConfigured,
  verifyChatSession,
} from "../../../lib/chat-session";
import { checkChatRateLimits, getClientIp } from "../../../lib/chat-rate-limit";
import { recordGroqResponse, recordGroqError } from "../../../lib/groq-status";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 24;
const PROVIDER_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOTAL_MESSAGE_CHARS = 24_000;

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
- For pricing, ALWAYS call the get_price_estimate tool to get the real number — never calculate a price yourself, never state a price the tool did not return.
- For a service with multiple options (like oil type), do NOT ask the customer which option they want before pricing it. Call the tool with no optionId — it returns the full price range across all options automatically. Only mention the specific options if the customer already stated a preference or asks what choices exist.
- Some services (marked in the pricing catalog as price-varies, e.g. battery) can NEVER be priced by you, even a rough range — their real price depends on things like exact type/size/warranty that vary too much to estimate safely. Never call the tool for these. If asked, say the price varies and the shop will confirm it in person or by phone.
- If the customer names a specific tire brand (e.g. Michelin, Toyo), match it to its tier using the brand list in the pricing catalog and use that tier automatically — never ask the customer which tier (economy/standard/premium) they mean.
- If the customer asks for appointment booking, help start an appointment request.
- For appointment requests, follow this STRICT priority order:
  1. First get the SERVICE needed and the VEHICLE year/make/model. Keep it simple — do not ask about oil type, tire brand, tire size, trim, engine, or other add-ons.
  2. Then ask for their NAME and PHONE NUMBER — these are required before scheduling.
  3. Only AFTER you have service, vehicle, name, and phone, say exactly: "Let me pull up available times for you." — this exact phrase remains for compatibility with the appointment UI. Do NOT ask them to pick a date/time yourself.
- Do not promise a confirmed appointment slot. Say the shop team will confirm the exact time.
- Do NOT ask for name or phone number just because the customer asked about pricing, a service, or hours. Only collect contact info when: (a) the customer wants to book/schedule, or (b) you asked "Would you like the shop team to follow up with you?" (or the Spanish equivalent) and they said yes.
- If it seems like the conversation is wrapping up and the customer hasn't asked to book, you may ask ONCE, naturally, whether they'd like the shop to follow up with them — do not repeat that offer if they decline or don't respond to it, and do not ask for name/phone unless they agree.
- If the customer asks for hours or address, answer clearly and directly.
- Keep answers short by default unless the user asks for detail.
- If the customer writes in Spanish, answer in Spanish. When triggering the picker in Spanish, say exactly: "Déjame mostrarte los horarios disponibles."
- If the customer writes in English, answer in English.
- Never invent business facts. When unsure, say you need to confirm at the shop.
- Never ask open-ended "when would you like to come in?" questions. Once you have name and phone, trigger the picker.

Keep it simple, not technical:
- You are talking to everyday customers, not mechanics. Never ask for technical specs — no tire size, no oil viscosity/type, no part numbers, no trim level. The shop staff will look those up from the vehicle info once the customer is in.
- The only vehicle info you may mention is year/make/model if the customer volunteers it. For booking, you must ask for it before name and phone. Do not ask for trim, engine, tire size, or anything else technical.
- Use common sense about vehicles. A normal car has ONE engine — never ask which engine, or "both engines," or anything that assumes a car has multiple engines. Only ask about "front vs rear" or "all four" for things that genuinely apply per-wheel (like tires or brakes), and only if the customer's request is ambiguous about how many they need.
- If something you're about to ask would sound like a strange or overly technical question to a regular driver, don't ask it — just note that the shop team will confirm it at check-in.

Tone:
- Friendly, like a helpful front-desk person.
- Never robotic, never overly formal.
- Light humor is okay if it feels natural.
`.trim();

const QUOTE_PROMPT = `
This conversation is happening on the quote page.
Your job is to help the customer with their question — a lead for the shop team is only created if they want to book, or agree to a follow-up. Answering a price/service question is NOT by itself a reason to collect contact info.

Collect details one at a time, simple and non-technical:
1. Service needed
2. Vehicle year, make, and model
3. Quantity only when it truly applies, like tires or another clearly per-item service. Never ask "how many" for an oil change or other single-service job unless the customer explicitly mentions multiple cars or multiple jobs.

Only ask for NAME and PHONE NUMBER if:
- the customer wants to book/schedule an appointment (then follow the strict order: service+vehicle, then name+phone, then trigger the picker with the exact phrase — do NOT ask when they want to come in yourself), OR
- you asked "Would you like the shop team to follow up with you?" (or the Spanish equivalent) and they said yes.

If they're just asking about price, services, or hours and haven't shown interest in booking, answer the question and do not ask for their name or phone. If the conversation seems to be ending without booking, you may ask ONCE whether they'd like a follow-up — if they decline or don't respond, drop it, do not ask again, and do not collect contact info.

Do not ask for all details at once.
Do not ask "how many" for oil changes, brakes, alignment, or other normal single-vehicle services.
Do not ask technical questions (tire size, oil type/viscosity, engine specs, part numbers) — the shop team looks these up from the vehicle info at check-in.
If they ask for price, call the get_price_estimate tool — never calculate it yourself. Otherwise say the shop will confirm after checking the vehicle.
Never ask open-ended scheduling questions — the picker handles that.
`.trim();

function buildForcedRetrySystemPrompt({ pricingContext, estimatesRule, lang }) {
  return `You pick the correct arguments and call the get_price_estimate tool. Do not ask the customer a question here — you must call the tool now.

${pricingContext}${estimatesRule}

Respond in ${lang === "es" ? "Spanish" : "English"}.`;
}

function buildFollowUpSystemPrompt(lang) {
  return `You relay a computed price result (given as JSON) to the customer in ${lang === "es" ? "Spanish" : "English"}. Use exactly the low/high figures given — never invent, round, or recompute them. One short, friendly sentence, framed as an estimate the shop confirms in person. Do not mention "tool," "JSON," or that a calculation happened. Do not ask a question.`;
}

class ChatInputError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function requestTimeoutMs() {
  const configured = Number(process.env.CHAT_REQUEST_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return 15_000;
  return Math.min(30_000, Math.max(3_000, Math.floor(configured)));
}

function cookieValue(request, name) {
  const fromNextRequest = request.cookies?.get?.(name)?.value;
  if (fromNextRequest) return fromNextRequest;
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function json(body, { status = 200, rate = null, extraHeaders = {} } = {}) {
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    ...extraHeaders,
  };
  if (rate) {
    headers["RateLimit-Limit"] = String(rate.limit);
    headers["RateLimit-Remaining"] = String(rate.remaining);
    headers["RateLimit-Reset"] = String(Math.ceil(rate.resetAt / 1000));
  }
  return Response.json(body, { status, headers });
}

const EMPTY_STATUS = {
  phase: "not_started",
  completed: false,
  leadCaptured: false,
  persisted: false,
  contact: { name: false, phone: false },
  appointment: { requested: false, timeSelected: false },
};

function errorResponse(message, code, status, { rate = null, conversation = null } = {}) {
  const response = json(
    {
      error: message,
      code,
      action: conversation?.action || { type: "retry", missingFields: [] },
      status: conversation?.status || EMPTY_STATUS,
    },
    { status, rate },
  );
  return response;
}

async function readJsonBody(request) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new ChatInputError("Invalid request body length.", "invalid_content_length");
    }
    if (parsedLength > MAX_BODY_BYTES) {
      throw new ChatInputError("Request body is too large.", "payload_too_large", 413);
    }
  }

  if (!request.body) throw new ChatInputError("A JSON request body is required.", "invalid_json");
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new ChatInputError("Request body is too large.", "payload_too_large", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ChatInputError("The request body must be valid UTF-8.", "invalid_json");
  }
  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Bad shape.");
    return payload;
  } catch {
    throw new ChatInputError("Invalid JSON payload.", "invalid_json");
  }
}

function validatePayload(payload) {
  if (payload.privacyConsent !== true) {
    throw new ChatInputError("Privacy consent is required before using chat.", "privacy_consent_required");
  }
  if (payload.lang !== "en" && payload.lang !== "es") {
    throw new ChatInputError("Unsupported language.", "invalid_language");
  }
  if (payload.context !== "quote" && payload.context !== "shop") {
    throw new ChatInputError("Unsupported chat context.", "invalid_context");
  }
  if (!Array.isArray(payload.messages) || !payload.messages.length) {
    throw new ChatInputError(`Messages must contain between 1 and ${MAX_MESSAGES} items.`, "invalid_messages");
  }

  let totalCharacters = 0;
  let messages = payload.messages.slice(-MAX_MESSAGES).map((message, index) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      throw new ChatInputError("Every message must be an object.", "invalid_messages");
    }
    if (message.role !== "assistant" && message.role !== "user") {
      throw new ChatInputError("Every message must have a valid role.", "invalid_messages");
    }
    if (index > 0 && payload.messages[index - 1]?.role === message.role) {
      throw new ChatInputError("Message roles must alternate.", "invalid_messages");
    }
    if (typeof message.content !== "string") {
      throw new ChatInputError("Every message must contain text.", "invalid_messages");
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) {
      throw new ChatInputError(`Each message must be 1-${MAX_MESSAGE_CHARS} characters.`, "invalid_messages");
    }
    totalCharacters += content.length;
    return { role: message.role, content };
  });

  while (messages.length > 1 && messages[0].role !== "assistant") {
    messages.shift();
  }

  if (messages[0].role !== "assistant" || messages[messages.length - 1].role !== "user") {
    throw new ChatInputError("Conversation history must start with the assistant and end with the customer.", "invalid_messages");
  }
  if (totalCharacters > MAX_TOTAL_MESSAGE_CHARS) {
    throw new ChatInputError("Conversation history is too large.", "invalid_messages", 413);
  }
  return { lang: payload.lang, context: payload.context, messages };
}

function folded(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function contactState(messages) {
  const phonePattern = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
  const userMessages = messages.filter((message) => message.role === "user");
  const userText = userMessages.map((message) => message.content).join("\n");
  const hasPhone = phonePattern.test(userText);
  const explicitName = /\b(?:my name is|name is|mi nombre es|me llamo)\s+[a-zA-Z\u00c0-\u017f][a-zA-Z\u00c0-\u017f\s.'-]{0,50}/i.test(userText);
  let hasName = explicitName;

  if (!hasName) {
    for (let index = 1; index < messages.length; index += 1) {
      const message = messages[index];
      const previous = messages[index - 1];
      if (message.role !== "user" || previous.role !== "assistant") continue;
      const question = folded(previous.content);
      if (!/\b(name|nombre|llamas)\b/.test(question)) continue;
      const candidate = message.content
        .replace(phonePattern, " ")
        .replace(/\b(?:my name is|name is|mi nombre es|me llamo)\b/gi, " ")
        .trim();
      const words = candidate.split(/\s+/).filter(Boolean);
      if (
        words.length >= 1 &&
        words.length <= 4 &&
        words.every((word) => /^[a-zA-Z\u00c0-\u017f.'-]+$/.test(word)) &&
        !/^(yes|no|si|okay|ok|thanks|gracias)$/i.test(candidate)
      ) {
        hasName = true;
        break;
      }
    }
  }

  if (hasPhone && !hasName) {
    const phoneMatch = userText.match(phonePattern);
    if (phoneMatch) {
      const beforePhone = userText.slice(0, phoneMatch.index).replace(/[\s,;]+$/, "");
      const lastSep = Math.max(beforePhone.lastIndexOf(","), beforePhone.lastIndexOf(";"));
      const candidate = (lastSep !== -1 ? beforePhone.slice(lastSep + 1) : (beforePhone.split(/[\s]+/).pop() || "")).trim();
      if (/^[a-zA-Z\u00c0-\u017f.'-]{2,}$/.test(candidate) && !/^(yes|no|si|okay|ok|thanks|gracias|please)$/i.test(candidate)) {
        hasName = true;
      }
    }
  }

  return { hasName, hasPhone, userText };
}

function buildConversationResult(messages, captureResult) {
  const { hasName, hasPhone, userText } = contactState(messages);
  const hasVehicle = Boolean(extractVehicle(messages));
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const requested = /(appointment|book|booking|schedule|come in|drop off|cita|agendar|programar|reservar|puedo ir|pasar)/i.test(
    folded(userText),
  );
  const timeSelected = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(latestUser) &&
    /(?:\bat\b|a las|today|tomorrow|hoy|manana|monday|tuesday|wednesday|thursday|friday|saturday|lunes|martes|miercoles|jueves|viernes|sabado)/i.test(
      folded(latestUser),
    );
  const leadCaptured = captureResult?.captured === true;
  const completed = leadCaptured && hasName && hasPhone && timeSelected;
  const missingFields = [!hasVehicle && "vehicle", !hasName && "name", !hasPhone && "phone"].filter(Boolean);
  const actionType = completed
    ? "lead_ready"
    : hasVehicle && hasName && hasPhone
      ? "show_availability"
      : "collect_details";

  return {
    action: { type: actionType, missingFields },
    status: {
      phase: completed ? "request_received" : hasVehicle && hasName && hasPhone ? "ready_for_time" : "collecting",
      completed,
      leadCaptured,
      persisted: captureResult?.persisted === true,
      contact: { name: hasName, phone: hasPhone },
      vehicle: { present: hasVehicle },
      appointment: { requested: requested || timeSelected, timeSelected },
    },
  };
}

function strictBookingReply({ lang, messages, content, isAppointmentFlow }) {
  if (!isAppointmentFlow) return content;
  const vehicle = extractVehicle(messages);
  const { hasName, hasPhone } = contactState(messages);
  const latest = latestUserMessage(messages);
  const wantsVehicle = !vehicle;
  const wantsContact = vehicle && (!hasName || !hasPhone);
  const readyForTimes = vehicle && hasName && hasPhone;
  if (readyForTimes) {
    return lang === "es"
      ? "Perfecto, gracias. Ya tengo todo y te muestro los horarios disponibles."
      : "Perfect, thanks. I’ve got everything I need, and I’m pulling up available times for you.";
  }
  if (wantsVehicle) {
    return lang === "es"
      ? "Claro. Necesito el a\u00f1o, marca y modelo del veh\u00edculo para seguir con la cita."
      : "Absolutely. I need the vehicle year, make, and model to keep going with the appointment.";
  }
  if (wantsContact) {
    return lang === "es"
      ? "Gracias. Ahora solo necesito tu nombre y tu n\u00famero de tel\u00e9fono para seguir con la cita."
      : "Thanks. Now I just need your name and phone number to keep going with the appointment.";
  }
  if (/follow up|seguimiento|contact|llamar|called?/.test(folded(latest))) return content;
  return content;
}

function latestUserMessage(messages) {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function fallbackReply({ lang, context, messages, pricingUnavailable = false }) {
  const userText = folded(latestUserMessage(messages));
  const inSpanish = lang === "es";
  const wantsHours = /\b(hours?|open|close|horario|abiert|cerrad|hoy)\b/.test(userText);
  const wantsLocation = /\b(address|location|where|ubicaci[oó]n|direcci[oó]n|ubicado)\b/.test(userText);
  const wantsBooking = /\b(appointment|book|booking|schedule|cita|agendar|reservar|programar)\b/.test(userText);
  const wantsPrice = /\b(price|quote|cost|how much|cu[aá]nto|precio|cotiz)\b/.test(userText);

  if (wantsHours) {
    return inSpanish
      ? "Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM, y los s\u00e1bados de 9:00 AM a 5:00 PM. \u00bfQuieres nuestra direcci\u00f3n o que te ayude con otro servicio?"
      : "We’re open Monday through Friday from 9:00 AM to 6:00 PM, and Saturday from 9:00 AM to 5:00 PM. Would you like our address or help with something else?";
  }

  if (wantsLocation) {
    return inSpanish
      ? "Nos encuentras en 623 E Taylor St, San Jos\u00e9, CA 95112, y tambi\u00e9n en 1407 N 10th St, San Jos\u00e9, CA 95112."
      : "You can find us at 623 E Taylor St, San Jose, CA 95112, and also at 1407 N 10th St, San Jose, CA 95112.";
  }

  if (wantsBooking) {
    return inSpanish
      ? "Claro. Dime qu\u00e9 servicio necesitas, tu nombre y tu n\u00famero de tel\u00e9fono, y te muestro los horarios disponibles."
      : "Absolutely. Tell me what service you need, your name, and your phone number, and I’ll show you available times.";
  }

  if (wantsPrice) {
    if (pricingUnavailable) {
      return inSpanish
        ? "Por ahora no puedo dar un precio exacto aqu\u00ed. Cu\u00e9ntame qu\u00e9 servicio necesitas y el taller te confirma el precio al ver el veh\u00edculo."
        : "I can’t give an exact price in chat right now. Tell me what service you need and the shop will confirm the price once they see the vehicle.";
    }
    return inSpanish
      ? "Puedo ayudarte con una cotizaci\u00f3n. Cu\u00e9ntame qu\u00e9 servicio necesitas y el veh\u00edculo para darte el mejor estimado."
      : "I can help with a quote. Tell me what service you need and your vehicle, and I’ll get you the best estimate.";
  }

  if (context === "quote") {
    return inSpanish
      ? "Puedo ayudarte con una cotizaci\u00f3n o a empezar una cita. Dime el servicio que necesitas y seguimos."
      : "I can help with a quote or get a booking started. Tell me what service you need and we’ll keep going.";
  }

  return inSpanish
    ? "Estoy aqu\u00ed para ayudarte con llantas, frenos, alineaci\u00f3n, aceite, bater\u00edas, rines, horario o ubicaci\u00f3n."
    : "I’m here to help with tires, brakes, alignment, oil changes, batteries, rims, hours, or location.";
}

function shouldBlockQuantityQuestion(userText, replyText) {
  const user = folded(userText);
  const reply = folded(replyText);
  const isSingleJob = /(oil change|cambio de aceite|brake|brakes|frenos|alignment|alineacion|battery|bateria|oil change)/.test(user);
  const asksQuantity = /(how many|one vehicle|more|multiple|cuantos|cuantas|un solo vehiculo|mas de un|varios)/.test(reply);
  return isSingleJob && asksQuantity;
}

function shouldBlockOilTypeQuestion(userText, replyText) {
  const user = folded(userText);
  const reply = folded(replyText);
  const isOilChange = /(oil change|cambio de aceite)/.test(user);
  const asksOilType = /(oil type|type of oil|synthetic|conventional|viscosity|grade|preferencia para el tipo de aceite|tipo de aceite|aceite sintetico|aceite convencional|viscosidad)/.test(reply);
  return isOilChange && asksOilType;
}

function shouldBlockVehicleYearQuestion(userText, replyText) {
  const user = folded(userText);
  const reply = folded(replyText);
  const isSimpleBooking = /(oil change|cambio de aceite|brake|brakes|frenos|alignment|alineacion|battery|bateria)/.test(user);
  const asksYear = /(what year|which year|year of your car|year is it|que ano|que a\u00f1o|a\u00f1o es|modelo|make and model|vehicle year|year of your|tell me the year)/.test(reply);
  return isSimpleBooking && asksYear;
}

function vehicleYearGuardReply(lang) {
  return lang === "es"
    ? "Claro. Te ayudo con eso sin preguntar m\u00e1s detalles t\u00e9cnicos. Solo necesito el a\u00f1o, modelo y marca del veh\u00edculo, y luego tu nombre y tu n\u00famero para seguir con la cita o la cotizaci\u00f3n."
    : "Absolutely. I can help with that without asking for technical details. I just need the vehicle year, make, and model first, and then your name and phone number to keep going with the quote or appointment.";
}

function quantityGuardReply(lang, userText) {
  const inSpanish = lang === "es";
  const user = folded(userText);
  if (/(oil change|cambio de aceite)/.test(user)) {
    return inSpanish
      ? "Claro, te ayudo con un cambio de aceite para ese veh\u00edculo. Solo necesito tu nombre y tu n\u00famero para seguir con la cita o la cotizaci\u00f3n."
      : "Absolutely, I can help with an oil change for that vehicle. I just need your name and phone number to keep going with the quote or appointment.";
  }
  return inSpanish
    ? "Claro, te ayudo con eso. Solo necesito tu nombre y tu n\u00famero para seguir con la cita o la cotizaci\u00f3n."
    : "Absolutely, I can help with that. I just need your name and phone number to keep going with the quote or appointment.";
}

function oilChangeGuardReply(lang, userText) {
  const inSpanish = lang === "es";
  const user = folded(userText);
  if (/(oil change|cambio de aceite)/.test(user)) {
    return inSpanish
      ? "Claro, te ayudo con un cambio de aceite para ese veh\u00edculo. Solo necesito tu nombre y tu n\u00famero para seguir con la cita o la cotizaci\u00f3n."
      : "Absolutely, I can help with an oil change for that vehicle. I just need your name and phone number to keep going with the quote or appointment.";
  }
  return inSpanish
    ? "Claro, te ayudo con eso. Solo necesito tu nombre y tu n\u00famero para seguir con la cita o la cotizaci\u00f3n."
    : "Absolutely, I can help with that. I just need your name and phone number to keep going with the quote or appointment.";
}

async function captureSafely(args, label) {
  try {
    return await captureChatRecord(args);
  } catch {
    console.error(`Chat record ${label} capture failed.`);
    return null;
  }
}

async function withTimeout(promise, fallback, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request) {
  if (!chatSessionConfigured()) {
    return errorResponse("Chat is temporarily unavailable.", "session_not_configured", 503);
  }

  const ip = getClientIp(request);
  const token = cookieValue(request, CHAT_SESSION_COOKIE);
  const session = await verifyChatSession(token);
  if (!session || (turnstileConfigured() && !session.challengeVerified)) {
    const anonymousRate = await checkChatRateLimits({ ip, sessionId: `anonymous:${ip}` });
    if (!anonymousRate.allowed) {
      const response = errorResponse("Too many requests. Please wait and try again.", "rate_limited", 429, {
        rate: anonymousRate,
      });
      response.headers.set("Retry-After", String(anonymousRate.retryAfter));
      return response;
    }
    return errorResponse(
      "Please start a new secure chat session.",
      turnstileConfigured() ? "session_challenge_required" : "invalid_session",
      401,
      { rate: anonymousRate },
    );
  }

  const rate = await checkChatRateLimits({ ip, sessionId: session.id });
  if (!rate.allowed) {
    const response = errorResponse("Too many requests. Please wait and try again.", "rate_limited", 429, { rate });
    response.headers.set("Retry-After", String(rate.retryAfter));
    return response;
  }

  let payload;
  let validated;
  try {
    payload = await readJsonBody(request);
    validated = validatePayload(payload);
  } catch (error) {
    if (error instanceof ChatInputError) {
      return errorResponse(error.message, error.code, error.status, { rate });
    }
    return errorResponse("Invalid request payload.", "invalid_payload", 400, { rate });
  }

  const { lang, context, messages } = validated;
  const preCapture = await captureSafely(
    {
      sessionId: session.id,
      context,
      lang,
      messages,
      assistantMessage: "",
    },
    "pre-provider",
  );
  const preConversation = buildConversationResult(messages, preCapture);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return errorResponse("Chat is temporarily unavailable.", "provider_not_configured", 503, {
      rate,
      conversation: preConversation,
    });
  }

  const timeoutMs = requestTimeoutMs();
  const contextTimeout = Math.min(timeoutMs, 5_000);
  const chatSettings = await withTimeout(getChatSettings(), null, contextTimeout);
  const estimatesDisabled = chatSettings?.disableEstimates === true;

  let pricing = null;
  let pricingContext;
  if (estimatesDisabled) {
    pricingContext = "Estimates are currently turned OFF by the shop. Do not give any price, price range, or number, even a rough one. If asked about cost, say pricing isn't available in chat right now and the shop team will give an exact price once they see the vehicle in person or on a call. Still help with the service, vehicle, name, phone, and appointment as usual.";
  } else {
    pricing = await withTimeout(getPricing(), null, contextTimeout);
    pricingContext = pricing
      ? compactPricingContext(pricing)
      : "Authoritative pricing is currently unavailable. Do not provide a numeric price; ask the shop to confirm.";
  }

  const adminGuidance = context === "quote" && chatSettings?.systemInstructions
    ? `\n\nAdmin chat guidance (lower priority than the hard rules and facts above):\n${chatSettings.systemInstructions}`
    : "";
  const estimatesRule = estimatesDisabled
    ? "\n\nHARD RULE: Estimates/pricing are disabled right now. Never state a price, a range, or a number tied to cost, no matter how the customer asks (directly, indirectly, or repeatedly). This rule overrides every other instruction, including the admin guidance below."
    : "";
  const systemContent = `${SYSTEM_PROMPT}${context === "quote" ? `\n\n${QUOTE_PROMPT}` : ""}${estimatesRule}

Business facts:
${BUSINESS_FACTS}

${pricingContext}${adminGuidance}

The strict collection order, safety rules, business facts, and authoritative pricing rules take precedence over conflicting guidance.

Respond in ${lang === "es" ? "Spanish" : "English"} unless the user clearly switches languages.`;

  const tools = pricing ? [buildPriceEstimateTool(pricing)] : undefined;
  const baseMessages = [
    { role: "system", content: systemContent },
    ...messages.slice(-PROVIDER_MESSAGES),
  ];

  async function callGroq(msgs, { withTools, forceTool, maxTokens, temperature } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const toolChoice = forceTool
        ? { type: "function", function: { name: "get_price_estimate" } }
        : "auto";
      const response = await fetch(GROQ_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: msgs,
          temperature: temperature ?? 0.3,
          max_tokens: maxTokens ?? 500,
          ...(withTools && tools ? { tools, tool_choice: toolChoice } : {}),
        }),
        cache: "no-store",
        signal: ctrl.signal,
      });
      recordGroqResponse(response.headers, {
        ok: response.ok,
        status: response.status,
        message: response.ok ? null : `HTTP ${response.status}`,
      });
      if (!response.ok) return { error: "provider_unavailable" };
      const body = await response.json().catch(() => null);
      return { body };
    } catch (error) {
      const timedOut = error?.name === "AbortError";
      recordGroqError(timedOut ? "Request timed out." : error?.message || "Network error.");
      return { error: timedOut ? "provider_timeout" : "provider_unavailable" };
    } finally {
      clearTimeout(timer);
    }
  }

  const first = await callGroq(baseMessages, { withTools: true });
  if (first.error) {
    const content = fallbackReply({
      lang,
      context,
      messages,
      pricingUnavailable: !pricing || estimatesDisabled,
    });
    const postCapture = await captureSafely(
      {
        sessionId: session.id,
        context,
        lang,
        messages,
        assistantMessage: content,
      },
      "fallback-provider",
    );
    const conversation = buildConversationResult(messages, postCapture || preCapture);
    return json(
      {
        message: content,
        action: conversation.action,
        status: conversation.status,
        fallback: true,
      },
      { rate },
    );
  }

  let firstMessage = first.body?.choices?.[0]?.message;
  let content = typeof firstMessage?.content === "string" ? firstMessage.content.trim() : "";
  let toolCalls = Array.isArray(firstMessage?.tool_calls) ? firstMessage.tool_calls.slice(0, 1) : [];

  // Small models sometimes ignore the "always call the tool" instruction and
  // either (a) just state a number themselves, or (b) ask the customer to
  // pick between options (e.g. oil type) instead of calling the tool with no
  // optionId to get the full range. Both cases skip the tool, so force a
  // retry that MUST call it — never let a freehand number or a forbidden
  // "which option?" question reach the customer.
  const looksLikePrice = /[$]\s?\d|\b\d{2,4}\s?(usd|dollars|dolares)\b/i;
  const optionLabels = pricing
    ? (pricing.services || [])
        .filter((s) => s.model === "options")
        .flatMap((s) => (s.options || []).map((o) => o?.label?.en).filter(Boolean))
    : [];
  const asksToPickOption = content.includes("?") &&
    optionLabels.filter((l) => content.toLowerCase().includes(String(l).toLowerCase())).length >= 2;
  if (!toolCalls.length && pricing && (looksLikePrice.test(content) || asksToPickOption)) {
    const retryMessages = [
      { role: "system", content: buildForcedRetrySystemPrompt({ pricingContext, estimatesRule, lang }) },
      ...messages.slice(-PROVIDER_MESSAGES),
    ];
    const forced = await callGroq(retryMessages, { withTools: true, forceTool: true });
    const forcedMessage = forced.body?.choices?.[0]?.message;
    const forcedCalls = Array.isArray(forcedMessage?.tool_calls) ? forcedMessage.tool_calls.slice(0, 1) : [];
    if (forcedCalls.length) {
      firstMessage = forcedMessage;
      content = typeof forcedMessage?.content === "string" ? forcedMessage.content.trim() : "";
      toolCalls = forcedCalls;
    } else {
      // Still no tool call — refuse to relay an unverified number rather than
      // risk a wrong price.
      content = fallbackReply({
        lang,
        context,
        messages,
        pricingUnavailable: !pricing || estimatesDisabled,
      });
      toolCalls = [];
    }
  }

  if (toolCalls.length && pricing) {
    const call = toolCalls[0];
    let args = {};
    try {
      args = JSON.parse(call.function?.arguments || "{}");
    } catch {
      args = {};
    }
    const result = runPriceEstimateTool(pricing, args);

    const followUp = await callGroq(
      [
        { role: "system", content: buildFollowUpSystemPrompt(lang) },
        { role: "user", content: JSON.stringify(result) },
      ],
      { withTools: false, maxTokens: 150, temperature: 0.2 },
    );
    const followUpContent = typeof followUp.body?.choices?.[0]?.message?.content === "string"
      ? followUp.body.choices[0].message.content.trim()
      : "";
    if (followUpContent) content = followUpContent;

    // Safety net: only trust the model's phrasing if it actually contains the
    // tool's real low/high numbers. Otherwise fall back to a deterministic
    // templated message built straight from the computed result, so a mangled
    // or dropped tool result never reaches the customer as a wrong price.
    if (result.ok && !replyMatchesComputedRange(content, result)) {
      content = renderDeterministicEstimate(result, lang);
    }
  }

  const latestText = latestUserMessage(messages);
  const appointmentIntent = /(appointment|book|booking|schedule|come in|drop off|cita|agendar|programar|reservar|puedo ir|pasar)/i.test(
    folded(latestText),
  );
  content = strictBookingReply({
    lang,
    messages,
    content,
    isAppointmentFlow: appointmentIntent || preConversation.status.appointment.requested || preConversation.status.contact.name || preConversation.status.contact.phone,
  });

  if (shouldBlockQuantityQuestion(latestUserMessage(messages), content)) {
    content = quantityGuardReply(lang, latestUserMessage(messages));
  }
  if (shouldBlockOilTypeQuestion(latestUserMessage(messages), content)) {
    content = oilChangeGuardReply(lang, latestUserMessage(messages));
  }
  if (shouldBlockVehicleYearQuestion(latestUserMessage(messages), content)) {
    content = vehicleYearGuardReply(lang);
  }

  content = content.slice(0, 4000);
  if (!content) {
    return errorResponse("The chat service returned an empty response. Please try again.", "provider_empty_response", 502, {
      rate,
      conversation: preConversation,
    });
  }

  const postCapture = await captureSafely(
    {
      sessionId: session.id,
      context,
      lang,
      messages,
      assistantMessage: content,
    },
    "post-provider",
  );
  const conversation = buildConversationResult(messages, postCapture || preCapture);

  return json(
    {
      message: content,
      action: conversation.action,
      status: conversation.status,
    },
    { rate },
  );
}
