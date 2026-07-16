import { isE2ETestMode } from "./runtime-mode";
import { gmailConfigured, listUnreadYelpLeadEmails, markProcessed, sendGmailEmail } from "./gmail-client";
import { parseYelpLeadEmail } from "./yelp-lead-parser";
import {
  findYelpLeadByGmailMessageId,
  insertPendingYelpLead,
  markYelpLeadReplied,
  markYelpLeadFailed,
  getResponderWatermark,
  setResponderWatermark,
} from "./yelp-leads-store";
import { generateYelpLeadReply } from "./yelp-lead-ai-reply";
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

async function processLead(rawEmail) {
  const lead = parseYelpLeadEmail(rawEmail);

  // Yelp's reply+<id>@messaging.yelp.com relay only accepts a single email
  // reply per conversation, ever — a second reply to the same thread bounces
  // ("You have already replied to this message... send another reply
  // through Yelp for Business"). So a "New Reply Message" follow-up
  // notification (which also carries no reply-to address of its own; see
  // lib/yelp-lead-parser.js) can never be auto-replied to by email, no
  // matter what address is used. The only thing this system can safely do
  // for a follow-up is alert the owner to answer it in the Yelp app/site.
  if (!lead.replyToAddress || lead.isFollowUpNotification) {
    console.warn(`Yelp lead ${lead.gmailMessageId} cannot be auto-replied to by email; alerting owner and marking processed.`);
    const existing = await findYelpLeadByGmailMessageId(lead.gmailMessageId);
    if (!existing) {
      const record = await insertPendingYelpLead({
        gmailMessageId: lead.gmailMessageId,
        senderEmail: null,
        customerName: lead.customerName,
        customerMessage:
          lead.customerMessage ||
          `Yelp notified that ${lead.customerName || "a customer"} sent a follow-up message. Yelp only allows one ` +
            "email reply per conversation, so this has to be answered directly in the Yelp app.",
      });
      await markYelpLeadFailed(record.id, null);
      await notifyOwnerOfFailure(
        lead,
        "Yelp mandó un mensaje de seguimiento que no se puede responder por correo (Yelp solo permite una " +
          "respuesta por correo por conversación) — hay que contestarle directamente en la app de Yelp.",
      );
    }
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
    await sendGmailEmail({
      to: lead.replyToAddress,
      fromEmail: YELP_REPLY_FROM_EMAIL,
      fromName: YELP_REPLY_FROM_NAME,
      subject: `Re: ${lead.subject}`,
      html: buildReplyHtml(replyText),
      threadId: lead.threadId,
      inReplyToMessageId: lead.messageIdHeader,
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
  return { gmailMessageId: lead.gmailMessageId, status: "replied", usedFallback: !aiReply };
}

/**
 * Entry point for app/api/cron/yelp-lead-responder/route.js. Checks Gmail for
 * unread Yelp "Request a Quote" leads received since the previous run, AI-drafts
 * a reply, and sends it directly through the same Gmail account (landing in
 * its own Sent folder, properly threaded) — no separate owner-notification
 * email on success, since the reply is already visible there.
 * lib/lead-notify.js (also Gmail-backed) is only used as a failure-escalation
 * alert if the Gmail send itself fails.
 *
 * Only messages received strictly after the last run's start time are ever
 * considered (see getResponderWatermark/setResponderWatermark), so an old
 * backlog — however it got left unread — can never be swept up again. The
 * very first run after this shipped has no prior watermark, so it treats
 * "now" as the cutoff and processes nothing older.
 */
export async function runYelpLeadResponder() {
  if (isE2ETestMode()) {
    return { skipped: true, reason: "e2e_test_mode", results: [] };
  }
  if (!gmailConfigured()) {
    return { skipped: true, reason: "gmail_not_configured", results: [] };
  }

  const runStartedAtMs = Date.now();
  const watermarkMs = await getResponderWatermark();
  const sinceMs = watermarkMs ?? runStartedAtMs;

  const emails = await listUnreadYelpLeadEmails({ sinceMs });
  const results = [];
  for (const email of emails) {
    try {
      results.push(await processLead(email));
    } catch (error) {
      console.error(`Unexpected error processing Yelp lead ${email.gmailMessageId}:`, error);
      results.push({ gmailMessageId: email.gmailMessageId, status: "error", error: error?.message });
    }
  }
  await setResponderWatermark(runStartedAtMs);
  return { skipped: false, checked: emails.length, results };
}
