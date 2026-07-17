import { escapeHtml, renderBrandedEmail } from "./email-template.js";
import { gmailConfigured, sendGmailEmail } from "./gmail-client.js";

const HANDOFF_RECIPIENT = "tires@tiressosrescue.com";
const ADMIN_URL = "https://tiressosrescue.com/admin";

function transcriptHtml(history) {
  return (Array.isArray(history) ? history : []).slice(-12).map((message) => {
    const label = message.role === "assistant" ? "Bot" : "Cliente";
    return `<p style="border-bottom:1px solid #e7ebef;margin:0;padding:9px 0;color:#536171;font-size:14px;line-height:20px;"><strong style="color:#182230;">${label}:</strong> ${escapeHtml(message.content)}</p>`;
  }).join("");
}

export async function sendWhatsAppHandoffEmail({ conversationId, waId, customerName, reason, history, lead }) {
  if (!gmailConfigured()) throw new Error("Gmail is not configured for WhatsApp handoff alerts.");
  const phone = `+${String(waId || "").replace(/\D/g, "")}`;
  const details = [
    ["Motivo", reason],
    ["Cliente", customerName || lead?.customerName || "Sin nombre"],
    ["Teléfono", phone],
    ["Servicio", lead?.service],
    ["Vehículo", lead?.vehicle],
  ].filter(([, value]) => value).map(([label, value]) => `<p style="margin:0;padding:6px 0;color:#536171;font-size:14px;"><strong style="color:#182230;">${label}:</strong> ${escapeHtml(value)}</p>`).join("");
  const adminUrl = `${ADMIN_URL}?view=whatsapp&conversation=${encodeURIComponent(conversationId)}`;
  const html = renderBrandedEmail({
    preheader: `Un cliente de WhatsApp necesita atención humana: ${phone}`,
    eyebrow: "WhatsApp · Intervención humana",
    title: "Un cliente necesita un representante",
    intro: "El asistente automático detectó que esta conversación necesita seguimiento humano y quedó en pausa.",
    content: `<div style="background:#f7f8fa;border:1px solid #e7ebef;border-radius:10px;padding:12px 16px;margin-bottom:18px;">${details}</div><h2 style="font-size:17px;color:#182230;margin:0 0 8px;">Conversación reciente</h2><div>${transcriptHtml(history)}</div>`,
    primary: { href: adminUrl, label: "Abrir bandeja de WhatsApp" },
    secondary: { href: `https://wa.me/${String(waId || "").replace(/\D/g, "")}`, label: "Abrir WhatsApp" },
    footerNote: "Responde desde el panel administrativo. El bot permanecerá apagado en este chat hasta que el equipo lo reactive.",
  });
  const result = await sendGmailEmail({
    to: HANDOFF_RECIPIENT,
    fromEmail: process.env.YELP_REPLY_FROM_EMAIL || "",
    fromName: process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue",
    subject: `WhatsApp necesita atención humana: ${customerName || lead?.customerName || phone}`,
    html,
  });
  return { accepted: true, messageId: result.id, recipient: HANDOFF_RECIPIENT };
}
