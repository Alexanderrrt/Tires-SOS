const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";
const DEFAULT_SMS_RECIPIENT = "9834564801@vtext.com";

export function notifyConfigured() {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY &&
    process.env.EMAILJS_PRIVATE_KEY,
  );
}

export async function notifyLead({ type, name, phone, email, message, vehicle, service, tireSize, preferredTime }) {
  if (!notifyConfigured()) {
    console.warn("Lead SMS skipped — EMAILJS env vars not configured.");
    return { sent: false, reason: "not_configured" };
  }

  const body = [
    `NEW LEAD: ${type || "CHAT"}`,
    name && `Name: ${name}`,
    phone && `Phone: ${phone}`,
    email && `Email: ${email}`,
    vehicle && `Vehicle: ${vehicle}`,
    tireSize && `Tire: ${tireSize}`,
    service && `Service: ${service}`,
    preferredTime && `When: ${preferredTime}`,
    message && `Info: ${message.slice(0, 200)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const recipient = process.env.NOTIFY_SMS_RECIPIENT || DEFAULT_SMS_RECIPIENT;

  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: {
      to_email: recipient,
      email: recipient,
      reply_to: email || "lead@tiressos.com",
      from_name: name || "Website Lead",
      from_email: email || "lead@tiressos.com",
      to_name: "Tires SOS",
      subject: `New Lead: ${type || "CHAT"}`,
      message: body,
    },
  };

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://tires-sos.vercel.app";

  const res = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: siteOrigin,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`EmailJS send failed (${res.status}): ${text}`);
  }

  console.log(`Lead SMS sent → ${recipient} (${type}: ${name || "unnamed"})`);
  return { sent: true, recipient };
}
