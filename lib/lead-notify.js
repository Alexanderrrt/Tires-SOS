import { isE2ETestMode } from "./runtime-mode";
import { gmailConfigured, sendGmailEmail } from "./gmail-client";
import { renderBrandedEmail, escapeHtml } from "./email-template";
import { detectStoreContact, getStoreContact } from "./store-contact.js";

const NOTIFY_FROM_EMAIL = process.env.YELP_REPLY_FROM_EMAIL || "";
const NOTIFY_FROM_NAME = process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue";

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SITE_ORIGIN = "https://tiressosrescue.com";

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
  return !isE2ETestMode() && gmailConfigured() && Boolean(process.env.NOTIFY_EMAIL_RECIPIENT?.trim());
}

export async function notifyLead({ type, name, phone, email, message, vehicle, service, tireSize, preferredTime, storeId }) {
  const recipient = process.env.NOTIFY_EMAIL_RECIPIENT?.trim();
  if (isE2ETestMode() || !gmailConfigured() || !recipient) {
    console.warn("Lead notification skipped: Gmail is not configured or NOTIFY_EMAIL_RECIPIENT is unset.");
    return { accepted: false, status: "not_configured" };
  }

  const store = storeId
    ? getStoreContact(storeId)
    : detectStoreContact({ text: [message, service].filter(Boolean).join(" ") });
  const values = [
    ["Tienda", store.businessName], ["Dirección de tienda", store.full], ["Teléfono de tienda", store.phone],
    ["Tipo", singleLine(type, 24) || "CHAT"], ["Nombre", singleLine(name, 60)],
    ["Teléfono", singleLine(phone, 40)], ["Correo", safeEmail(email)],
    ["Vehículo", singleLine(vehicle, 120)], ["Llanta", singleLine(tireSize, 24)],
    ["Servicio", singleLine(service, 80)], ["Cuándo", singleLine(preferredTime, 80)],
    ["Información", singleLine(message, 200)],
  ].filter(([, value]) => value);
  const body = `<div style="background:#f7f8fa;border:1px solid #e7ebef;border-radius:10px;padding:4px 16px;">${values.map(([label, value]) => `<p style="border-bottom:1px solid #e7ebef;padding:8px 0;margin:0;color:#536171;font-size:14px;"><strong style="color:#182230;">${label}:</strong> ${escapeHtml(value)}</p>`).join("")}</div>`;
  const replyTo = values.find(([label]) => label === "Correo")?.[1];
  const customerPhoneDigits = singleLine(phone, 40).replace(/\D/g, "");
  const customerPhoneHref = customerPhoneDigits.length === 10
    ? `tel:+1${customerPhoneDigits}`
    : customerPhoneDigits.length > 10 ? `tel:+${customerPhoneDigits}` : "";

  try {
    const result = await sendGmailEmail({
      to: recipient,
      fromEmail: NOTIFY_FROM_EMAIL,
      fromName: NOTIFY_FROM_NAME,
      subject: `${store.businessName}: nuevo cliente — ${singleLine(name, 60) || "Sin nombre"}`,
      html: renderBrandedEmail({
        preheader: `Nuevo cliente de ${values[0][1]} para Tires SOS Rescue`,
        eyebrow: `${store.businessName} · Nuevo cliente`,
        title: "Un cliente necesita ayuda",
        intro: `Se recibió una nueva solicitud de ${values[0][1].toLowerCase()} a través del sitio web.`,
        content: body,
        primary: customerPhoneHref ? { href: customerPhoneHref, label: "Llamar al cliente" } : null,
        secondary: replyTo ? { href: `mailto:${replyTo}`, label: "Responder por correo" } : null,
        footerNote: `Enviado desde ${siteOrigin()} para ${store.full}. Revisa los detalles y responde lo antes posible.`,
        location: store,
      }),
      replyTo,
    });
    console.info("Lead notification sent via Gmail.");
    return { accepted: true, status: "provider_accepted", messageId: result.id };
  } catch {
    throw new LeadNotificationError("provider_unavailable");
  }
}
