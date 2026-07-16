const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_SANDBOX_FROM = "onboarding@resend.dev";
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_TIMEOUT_MS = 5000;

function envValue(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value) {
  return EMAIL_ADDRESS.test(value);
}

export function resendConfig() {
  const apiKey = envValue("RESEND_API_KEY");
  const from = envValue("RESEND_FROM_EMAIL") || DEFAULT_SANDBOX_FROM;
  const fromName = envValue("RESEND_FROM_NAME") || "Tire SOS Admin Panel";
  const configuredRecipient = envValue("NOTIFY_EMAIL_RECIPIENT");
  const sandboxRecipient = envValue("RESEND_SANDBOX_RECIPIENT") || configuredRecipient;
  const sandbox = envValue("RESEND_SANDBOX_MODE") === "1";

  if (!apiKey || !validEmail(from)) return null;
  if (sandbox && !validEmail(sandboxRecipient)) return null;
  if (!sandbox && !validEmail(configuredRecipient)) return null;

  return { apiKey, from, fromName, recipient: sandbox ? sandboxRecipient : configuredRecipient, sandbox };
}

export function resendConfigured() {
  return Boolean(resendConfig());
}

export async function sendResendEmail({ to, subject, html, replyTo, from, fromName }) {
  const config = resendConfig();
  if (!config) return { accepted: false, status: "not_configured" };

  // Sandbox mode always wins, so no in-development run can ever email a real
  // customer: only when it's off does an explicit `to`/`from` override apply
  // (used by the Yelp lead auto-responder to reply to the actual lead from
  // Tires@tiressosrescue.com instead of the shop-owner notification address).
  const recipient = !config.sandbox && validEmail(to) ? to : config.recipient;
  const senderEmail = validEmail(from) ? from : config.from;
  const senderName = fromName || config.fromName;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: recipient,
        subject,
        html,
        ...(validEmail(replyTo) ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.id) {
      const error = new Error("Resend rejected the email.");
      error.code = response.status >= 500 || response.status === 429 ? "provider_unavailable" : "provider_rejected";
      throw error;
    }
    return { accepted: true, status: "provider_accepted", messageId: payload.id };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Resend timed out.");
      timeoutError.code = "provider_timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
