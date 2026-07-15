import { isE2ETestMode } from "./runtime-mode";
import { resendConfig, sendResendEmail } from "./resend";
import { renderBrandedEmail, escapeHtml } from "./email-template";

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SITE_ORIGIN = "https://tires-sos.vercel.app";

class LeadNotificationError extends Error {
  constructor(code) {
    super("The notification provider did not accept the request.");
    this.name = "LeadNotificationError";
    this.code = code;
  }
}

function singleLine(value, maxLength) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function safeEmail(value) {
  const email = singleLine(value, 160);
  return EMAIL_ADDRESS.test(email) ? email : "";
}

function siteOrigin() {
  const value = singleLine(process.env.NEXT_PUBLIC_SITE_URL, 200);
  return /^https?:\/\//i.test(value) ? value.replace(/\/$/, "") : DEFAULT_SITE_ORIGIN;
}

export function notifyConfigured() {
  return !isE2ETestMode() && Boolean(resendConfig());
}

export async function notifyLead({ type, name, phone, email, message, vehicle, service, tireSize, preferredTime }) {
  if (isE2ETestMode() || !resendConfig()) {
    console.warn("Lead notification skipped: Resend configuration is incomplete or invalid.");
    return { accepted: false, status: "not_configured" };
  }

  const values = [
    ["Type", singleLine(type, 24) || "CHAT"], ["Name", singleLine(name, 60)],
    ["Phone", singleLine(phone, 40)], ["Email", safeEmail(email)],
    ["Vehicle", singleLine(vehicle, 120)], ["Tire", singleLine(tireSize, 24)],
    ["Service", singleLine(service, 80)], ["When", singleLine(preferredTime, 80)],
    ["Info", singleLine(message, 200)],
  ].filter(([, value]) => value);
  const body = `<div style="background:#f7f8fa;border:1px solid #e7ebef;border-radius:10px;padding:4px 16px;">${values.map(([label, value]) => `<p style="border-bottom:1px solid #e7ebef;padding:8px 0;margin:0;color:#536171;font-size:14px;"><strong style="color:#182230;">${label}:</strong> ${escapeHtml(value)}</p>`).join("")}</div>`;
  const replyTo = values.find(([label]) => label === "Email")?.[1];

  try {
    const result = await sendResendEmail({
      subject: `New Lead: ${values[0][1]}`,
      html: renderBrandedEmail({
        preheader: `New ${values[0][1]} lead for Tires SOS Rescue`,
        eyebrow: "New website lead",
        title: "A customer needs help",
        intro: `A new ${values[0][1].toLowerCase()} request was submitted through your website.`,
        content: body,
        primary: { href: "tel:+14083328962", label: "Call customer" },
        secondary: replyTo ? { href: `mailto:${replyTo}`, label: "Reply by email" } : null,
        footerNote: `Submitted from ${siteOrigin()}. Review the details above and follow up promptly.`,
      }),
      replyTo,
    });
    console.info("Lead notification accepted by Resend.");
    return result;
  } catch (error) {
    throw new LeadNotificationError(error?.code || "provider_unavailable");
  }
}
