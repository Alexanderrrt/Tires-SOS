import { SERVICES, SITE } from "../../site.config";
import { getChatSettings } from "../../../lib/chat-settings-store";
import { captureChatRecord } from "../../../lib/chat-records-store";
import { loadChatPricingContext } from "../../../lib/chat-pricing-context";
import {
  CHAT_SESSION_COOKIE,
  chatSessionConfigured,
  turnstileConfigured,
  verifyChatSession,
} from "../../../lib/chat-session";
import { checkChatRateLimits, getClientIp } from "../../../lib/chat-rate-limit";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
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
- For pricing, calculate only from the authoritative pricing rules supplied below. Never invent a price.
- If the customer asks for appointment booking, help start an appointment request.
- For appointment requests, follow this STRICT priority order:
  1. First get the SERVICE needed and VEHICLE info.
  2. Then ask for their NAME and PHONE NUMBER — these are required before scheduling.
  3. Only AFTER you have name and phone, say exactly: "Let me pull up available times for you." — this exact phrase remains for compatibility with the appointment UI. Do NOT ask them to pick a date/time yourself.
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
5. Only AFTER you have name and phone, trigger the appointment picker with the exact phrase defined above. Do NOT ask when they want to come in yourself.

Do not ask for all details at once.
If they ask for price, use the authoritative current estimate rules. Otherwise say the shop will confirm after checking the vehicle.
Never ask open-ended scheduling questions — the picker handles that.
`.trim();

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
  if (!Array.isArray(payload.messages) || !payload.messages.length || payload.messages.length > MAX_MESSAGES) {
    throw new ChatInputError(`Messages must contain between 1 and ${MAX_MESSAGES} items.`, "invalid_messages");
  }

  let totalCharacters = 0;
  const messages = payload.messages.map((message, index) => {
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
  const missingFields = [!hasName && "name", !hasPhone && "phone"].filter(Boolean);
  const actionType = completed
    ? "lead_ready"
    : hasName && hasPhone
      ? "show_availability"
      : "collect_details";

  return {
    action: { type: actionType, missingFields },
    status: {
      phase: completed ? "request_received" : hasName && hasPhone ? "ready_for_time" : "collecting",
      completed,
      leadCaptured,
      persisted: captureResult?.persisted === true,
      contact: { name: hasName, phone: hasPhone },
      appointment: { requested: requested || timeSelected, timeSelected },
    },
  };
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
  const [chatSettings, pricingContext] = await Promise.all([
    withTimeout(getChatSettings(), null, contextTimeout),
    withTimeout(
      loadChatPricingContext(),
      "Authoritative pricing is currently unavailable. Do not provide a numeric price; ask the shop to confirm.",
      contextTimeout,
    ),
  ]);

  const adminGuidance = context === "quote" && chatSettings?.systemInstructions
    ? `\n\nAdmin chat guidance (lower priority than the hard rules and facts above):\n${chatSettings.systemInstructions}`
    : "";
  const systemContent = `${SYSTEM_PROMPT}${context === "quote" ? `\n\n${QUOTE_PROMPT}` : ""}

Business facts:
${BUSINESS_FACTS}

${pricingContext}${adminGuidance}

The strict collection order, safety rules, business facts, and authoritative pricing rules take precedence over conflicting guidance.

Respond in ${lang === "es" ? "Spanish" : "English"} unless the user clearly switches languages.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let data;
  try {
    const response = await fetch(GROQ_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemContent },
          ...messages.slice(-PROVIDER_MESSAGES),
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return errorResponse("The chat service is temporarily unavailable.", "provider_unavailable", 502, {
        rate,
        conversation: preConversation,
      });
    }
    data = await response.json().catch(() => null);
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return errorResponse(
      timedOut ? "The chat request timed out. Please try again." : "The chat service is temporarily unavailable.",
      timedOut ? "provider_timeout" : "provider_unavailable",
      timedOut ? 504 : 502,
      { rate, conversation: preConversation },
    );
  } finally {
    clearTimeout(timeout);
  }

  const content = typeof data?.choices?.[0]?.message?.content === "string"
    ? data.choices[0].message.content.trim().slice(0, 4000)
    : "";
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
