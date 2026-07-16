import { isE2ETestMode } from "./runtime-mode";
import { gmailConfigured, listUnreadYelpLeadEmails, markProcessed } from "./gmail-client";
import { parseYelpLeadEmail } from "./yelp-lead-parser";
import {
  findYelpLeadByGmailMessageId,
  insertPendingYelpLead,
  markYelpLeadReplied,
  markYelpLeadFailed,
} from "./yelp-leads-store";
import { generateYelpLeadReply } from "./yelp-lead-ai-reply";
import { sendResendEmail, resendConfig } from "./resend";
import { renderBrandedEmail, escapeHtml } from "./email-template";
import { notifyLead } from "./lead-notify";

const YELP_REPLY_FROM_EMAIL = process.env.YELP_REPLY_FROM_EMAIL || "";
const YELP_REPLY_FROM_NAME = process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue";

const FALLBACK_REPLY =
  "Thanks so much for reaching out through Yelp! We received your request and a member of our team will follow " +
  "up with you shortly. If it's urgent, feel free to call or WhatsApp us at (408) 332-8962 — Tires SOS Rescue.";

function buildReplyHtml(replyText) {
  const paragraphs = replyText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:#182230;font-size:15px;line-height:23px;">${escapeHtml(line)}</p>`)
    .join("");
  return renderBrandedEmail({
    preheader: "Thanks for reaching out to Tires SOS Rescue",
    eyebrow: "Tires SOS Rescue",
    title: "We got your request!",
    content: paragraphs,
    primary: { href: "https://wa.me/14083328962", label: "WhatsApp us" },
    secondary: { href: "tel:+14083328962", label: "Call us" },
    footerNote: "Replying to your Yelp Request a Quote.",
  });
}

async function notifyOwnerOfFailure(lead, reason) {
  try {
    await notifyLead({
      type: "YELP (falló la respuesta automática)",
      name: lead.customerName,
      email: lead.replyToAddress,
      message: `${reason}\n\nMensaje original: ${lead.customerMessage.slice(0, 300)}`,
    });
  } catch {
    console.error("Failed to notify owner about a failed Yelp auto-reply.");
  }
}

async function notifyOwnerOfReply(lead) {
  try {
    await notifyLead({
      type: "YELP",
      name: lead.customerName,
      email: lead.replyToAddress,
      message: lead.customerMessage.slice(0, 200),
    });
  } catch {
    console.error("Failed to notify owner about an auto-replied Yelp lead.");
  }
}

async function processLead(rawEmail) {
  const lead = parseYelpLeadEmail(rawEmail);

  if (!lead.replyToAddress) {
    console.warn(`Yelp lead ${lead.gmailMessageId} has no usable reply-to address; skipping and marking processed.`);
    await markProcessed(lead.gmailMessageId);
    return { gmailMessageId: lead.gmailMessageId, status: "skipped_no_address" };
  }

  const existing = await findYelpLeadByGmailMessageId(lead.gmailMessageId);
  if (existing) {
    // Already stored from a previous run that crashed before marking Gmail
    // read. Don't re-email the customer; just clear the Gmail flag.
    await markProcessed(lead.gmailMessageId);
    return { gmailMessageId: lead.gmailMessageId, status: "already_processed" };
  }
  const record = await insertPendingYelpLead({
    gmailMessageId: lead.gmailMessageId,
    senderEmail: lead.replyToAddress,
    customerName: lead.customerName,
    customerMessage: lead.customerMessage,
  });

  const aiReply = await generateYelpLeadReply({
    customerMessage: lead.customerMessage,
    customerName: lead.customerName,
  });
  const replyText = aiReply || FALLBACK_REPLY;

  try {
    await sendResendEmail({
      to: lead.replyToAddress,
      subject: `Re: ${lead.subject}`,
      html: buildReplyHtml(replyText),
      from: YELP_REPLY_FROM_EMAIL,
      fromName: YELP_REPLY_FROM_NAME,
    });
  } catch (error) {
    console.error(`Failed to send Yelp auto-reply for ${lead.gmailMessageId}:`, error);
    await markYelpLeadFailed(record.id, replyText);
    await notifyOwnerOfFailure(lead, `El correo de respuesta no se pudo enviar (${error?.code || error?.message || "error"}).`);
    // Mark processed even on send failure — the owner has been alerted to
    // respond manually, and this avoids retrying (and risking a duplicate
    // customer email) on every subsequent cron tick.
    await markProcessed(lead.gmailMessageId);
    return { gmailMessageId: lead.gmailMessageId, status: "send_failed" };
  }

  await markYelpLeadReplied(record.id, replyText);
  await markProcessed(lead.gmailMessageId);
  await notifyOwnerOfReply(lead);
  return { gmailMessageId: lead.gmailMessageId, status: "replied", usedFallback: !aiReply };
}

/**
 * Entry point for app/api/cron/yelp-lead-responder/route.js. Checks Gmail for
 * unread Yelp "Request a Quote" leads, AI-drafts and sends a reply to each
 * one via Resend, records it in Supabase, and notifies the shop owner.
 */
export async function runYelpLeadResponder() {
  if (isE2ETestMode()) {
    return { skipped: true, reason: "e2e_test_mode", results: [] };
  }
  if (!gmailConfigured()) {
    return { skipped: true, reason: "gmail_not_configured", results: [] };
  }
  if (!resendConfig()) {
    return { skipped: true, reason: "resend_not_configured", results: [] };
  }

  const emails = await listUnreadYelpLeadEmails();
  const results = [];
  for (const email of emails) {
    try {
      results.push(await processLead(email));
    } catch (error) {
      console.error(`Unexpected error processing Yelp lead ${email.gmailMessageId}:`, error);
      results.push({ gmailMessageId: email.gmailMessageId, status: "error", error: error?.message });
    }
  }
  return { skipped: false, checked: emails.length, results };
}
