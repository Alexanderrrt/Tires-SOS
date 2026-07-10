const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";
const DEFAULT_SITE_ORIGIN = "https://tires-sos.vercel.app";

const REQUEST_TIMEOUT_MS = 3000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SAFE_ERROR_MESSAGES = {
  provider_rejected: "The notification provider rejected the request.",
  provider_timeout: "The notification provider timed out.",
  provider_unavailable: "The notification provider is temporarily unavailable.",
};

class LeadNotificationError extends Error {
  constructor(code) {
    super(SAFE_ERROR_MESSAGES[code] || "The notification could not be accepted.");
    this.name = "LeadNotificationError";
    this.code = code;
  }
}

function envValue(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function validRecipient(value) {
  return EMAIL_ADDRESS.test(value);
}

// The lead notification recipient always comes from the environment — there
// is no fallback address in source. If NOTIFY_EMAIL_RECIPIENT isn't set (or
// isn't a valid email), notifications are simply disabled everywhere,
// including in development.
function notificationConfig() {
  const provider = {
    serviceId: envValue("EMAILJS_SERVICE_ID"),
    templateId: envValue("EMAILJS_TEMPLATE_ID"),
    publicKey: envValue("EMAILJS_PUBLIC_KEY"),
    privateKey: envValue("EMAILJS_PRIVATE_KEY"),
  };

  if (!provider.serviceId || !provider.templateId || !provider.publicKey || !provider.privateKey) {
    return null;
  }

  const recipient = envValue("NOTIFY_EMAIL_RECIPIENT");
  if (!recipient || !validRecipient(recipient)) return null;
  return { ...provider, recipient };
}

function parseOrigin(value, addHttps = false) {
  if (!value) return "";
  try {
    const candidate = addHttps && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

function siteOrigin() {
  const configuredOrigin = parseOrigin(envValue("NEXT_PUBLIC_SITE_URL"));
  if (configuredOrigin) return configuredOrigin;

  const vercelOrigin = parseOrigin(envValue("VERCEL_URL"), true);
  return vercelOrigin || DEFAULT_SITE_ORIGIN;
}

function singleLine(value, maxLength) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function safeEmail(value) {
  const email = singleLine(value, 160);
  return EMAIL_ADDRESS.test(email) ? email : "lead@tiressos.com";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function sendAttempt(payload, origin) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(EMAILJS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) return { accepted: true };

    // Consume and discard the provider response. It can contain configuration
    // details and must never be copied into application logs or API responses.
    await response.text().catch(() => "");
    const retryable = retryableStatus(response.status);
    return {
      accepted: false,
      retryable,
      code: retryable ? "provider_unavailable" : "provider_rejected",
    };
  } catch (error) {
    return {
      accepted: false,
      retryable: true,
      code: error?.name === "AbortError" ? "provider_timeout" : "provider_unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWithRetry(payload, origin) {
  let lastCode = "provider_unavailable";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await sendAttempt(payload, origin);
    if (result.accepted) return;

    lastCode = result.code;
    if (!result.retryable || attempt === MAX_ATTEMPTS) break;

    console.warn("Lead notification attempt failed; retrying.", { attempt, code: result.code });
    await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
  }

  throw new LeadNotificationError(lastCode);
}

export function notifyConfigured() {
  return Boolean(notificationConfig());
}

export async function notifyLead({ type, name, phone, email, message, vehicle, service, tireSize, preferredTime }) {
  const config = notificationConfig();
  if (!config) {
    console.warn("Lead notification skipped: notification configuration is incomplete or invalid.");
    return { accepted: false, status: "not_configured" };
  }

  const leadType = singleLine(type, 24) || "CHAT";
  const leadName = singleLine(name, 60);
  const leadPhone = singleLine(phone, 40);
  const leadEmail = singleLine(email, 160);
  const leadVehicle = singleLine(vehicle, 120);
  const leadTireSize = singleLine(tireSize, 24);
  const leadService = singleLine(service, 80);
  const leadPreferredTime = singleLine(preferredTime, 80);
  const leadMessage = singleLine(message, 200);
  const replyTo = safeEmail(leadEmail);
  const body = [
    `NEW LEAD: ${leadType}`,
    leadName && `Name: ${leadName}`,
    leadPhone && `Phone: ${leadPhone}`,
    leadEmail && EMAIL_ADDRESS.test(leadEmail) && `Email: ${leadEmail}`,
    leadVehicle && `Vehicle: ${leadVehicle}`,
    leadTireSize && `Tire: ${leadTireSize}`,
    leadService && `Service: ${leadService}`,
    leadPreferredTime && `When: ${leadPreferredTime}`,
    leadMessage && `Info: ${leadMessage}`,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    accessToken: config.privateKey,
    template_params: {
      to_email: config.recipient,
      email: config.recipient,
      reply_to: replyTo,
      from_name: leadName || "Website Lead",
      from_email: replyTo,
      to_name: "Tires SOS",
      subject: `New Lead: ${leadType}`,
      message: body,
    },
  };

  await sendWithRetry(payload, siteOrigin());
  console.info("Lead notification accepted by EmailJS.");
  return { accepted: true, status: "provider_accepted" };
}
