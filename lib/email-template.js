import { SITE } from "../app/site.config";

const ORIGIN = SITE.url.replace(/\/$/, "");
const EMAIL_LOGO = `${ORIGIN}/logo-mark.png`;
const PHONE_HREF = "tel:+14083328962";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function button(href, label, filled = true) {
  const background = filled ? "#f97316" : "#202938";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${background};border-radius:7px;color:#ffffff;font-size:14px;font-weight:700;line-height:20px;padding:12px 18px;text-decoration:none;margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

export function renderBrandedEmail({ preheader, eyebrow, title, intro, content, primary, secondary, footerNote }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f5f7;color:#182230;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f5f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(24,34,48,.10);">
        <tr><td style="height:7px;background:#f97316;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 30px 18px;border-bottom:1px solid #edf0f3;">
          <a href="${ORIGIN}" style="text-decoration:none;display:inline-block;"><img src="${EMAIL_LOGO}" width="78" alt="Tires SOS Rescue" style="display:block;width:78px;height:auto;border:0;"></a>
          <div style="color:#f97316;font-size:11px;font-weight:800;letter-spacing:1.7px;margin-top:14px;text-transform:uppercase;">${escapeHtml(eyebrow || "Tires SOS Rescue")}</div>
          <h1 style="font-size:29px;line-height:35px;margin:7px 0 8px;color:#182230;letter-spacing:-.4px;">${escapeHtml(title)}</h1>
          ${intro ? `<p style="font-size:16px;line-height:25px;color:#5c6876;margin:0;">${escapeHtml(intro)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:26px 30px 18px;">${content || ""}</td></tr>
        ${(primary || secondary) ? `<tr><td style="padding:0 30px 22px;">${primary ? button(primary.href, primary.label, true) : ""}${secondary ? button(secondary.href, secondary.label, false) : ""}</td></tr>` : ""}
        <tr><td style="background:#182230;padding:24px 30px;">
          <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 8px;">Tires SOS Rescue</p>
          <p style="color:#b9c3ce;font-size:12px;line-height:19px;margin:0 0 15px;">${escapeHtml(footerNote || "Fast, friendly tire and auto service in San José.")}</p>
          <p style="margin:0;">${button(SITE.whatsappHref, "WhatsApp", true)}${button(SITE.smsHref, "SMS", false)}${button(PHONE_HREF, "Call", false)}</p>
          <p style="font-size:11px;line-height:18px;margin:9px 0 0;color:#8f9baa;"><a href="${SITE.locations[0].mapsHref}" style="color:#fbbf24;text-decoration:none;">Get directions</a> &nbsp;·&nbsp; <a href="${ORIGIN}" style="color:#fbbf24;text-decoration:none;">Visit website</a></p>
        </td></tr>
      </table>
      <p style="font-size:11px;line-height:17px;color:#8f9baa;margin:16px 12px 0;text-align:center;">This message was sent by the Tires SOS Rescue website.</p>
    </td></tr>
  </table>
</body></html>`;
}

export { escapeHtml };
