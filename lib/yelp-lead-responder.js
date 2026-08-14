import { isE2ETestMode } from "./runtime-mode";
import {
  findYelpRelaySourceMessageId,
  gmailConfigured,
  listUnreadYelpLeadEmails,
  listUnreadYelpRejectionEmails,
  markProcessed,
  sendGmailEmail,
} from "./gmail-client";
import { parseYelpLeadEmail } from "./yelp-lead-parser";
import {
  findYelpLeadByGmailMessageId,
  insertPendingYelpLead,
  markYelpLeadReplied,
  markYelpLeadFailed,
  markYelpLeadDeliveryFailed,
  getResponderWatermark,
  setResponderWatermark,
} from "./yelp-leads-store";
import { generateYelpLeadReply } from "./yelp-lead-ai-reply";
import { notifyLead } from "./lead-notify";
import { getStoreContact } from "./store-contact.js";
import { renderYelpRelayHtml } from "./yelp-relay-message.js";

const YELP_REPLY_FROM_EMAIL = process.env.YELP_REPLY_FROM_EMAIL || "";
const YELP_REPLY_FROM_NAME = process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue";

function fallbackReply(store) {
  return [
    "Thanks for reaching out through Yelp! We received your request and would be happy to help. Reply here with your vehicle details, or call/WhatsApp us for an exact quote.",
    "",
    `${store.businessName} | ${store.phone}`,
    store.full,
  ].join("\n");
}

// Only genuine Yelp infrastructure is ever acted on. The Gmail search query
// already scopes to Yelp senders, but Gmail's from: operator can also match a
// spoofed display name (e.g. `"messaging.yelp.com" <attacker@evil.com>`), so
// the real sender domain is re-checked here before anything is sent.
const TRUSTED_SENDER_DOMAINS = new Set(["yelp.com", "messaging.yelp.com"]);
// Auto-replies may only ever be emailed to Yelp's per-thread relay.
const REPLYABLE_DOMAIN = "messaging.yelp.com";

function addressDomain(address) {
  const value = String(address || "").toLowerCase();
  const at = value.lastIndexOf("@");
  return at >= 0 ? value.slice(at + 1) : "";
}

async function notifyOwnerOfFailure(lead, reason) {
  try {
    await notifyLead({
      type: "YELP (falló la respuesta automática)",
      name: lead.customerName,
      email: lead.replyToAddress,
      message: `${reason}\n\nMensaje original: ${lead.customerMessage.slice(0, 300)}`,
      storeId: lead.storeId,
    });
  } catch {
    console.error("Failed to notify owner about a failed Yelp auto-reply.");
  }
}

async function processLead(rawEmail) {
  const lead = parseYelpLeadEmail(rawEmail);
  const store = getStoreContact(lead.storeId);

  // Sender verification (defense in depth): if the real From address is not an
  // actual Yelp domain, this message reached the query via a spoofed display
  // name. Never draft, store, or reply to it — just clear it so it isn't seen
  // again.
  if (!TRUSTED_SENDER_DOMAINS.has(addressDomain(lead.fromAddress))) {
    console.warn(
      `Yelp lead ${lead.gmailMessageId} has an untrusted sender (${lead.fromAddress || "no address"}); skipping.`,
    );
    await markProcessed(lead.gmailMessageId);
    return { gmailMessageId: lead.gmailMessageId, status: "skipped_untrusted_sender" };
  }

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

  // Never email anything other than Yelp's own per-thread relay. A reply target
  // on any other domain (e.g. injected via a spoofed Reply-To header) is treated
  // like the no-address case: alert the owner to answer in Yelp, never auto-send.
  if (addressDomain(lead.replyToAddress) !== REPLYABLE_DOMAIN) {
    console.warn(
      `Yelp lead ${lead.gmailMessageId} reply address (${lead.replyToAddress}) is not the Yelp relay; alerting owner and marking processed.`,
    );
    const existingUntrusted = await findYelpLeadByGmailMessageId(lead.gmailMessageId);
    if (!existingUntrusted) {
      const record = await insertPendingYelpLead({
        gmailMessageId: lead.gmailMessageId,
        senderEmail: null,
        customerName: lead.customerName,
        customerMessage: lead.customerMessage,
      });
      await markYelpLeadFailed(record.id, null);
      await notifyOwnerOfFailure(
        { ...lead, replyToAddress: "" },
        "No se pudo verificar la dirección de respuesta de este mensaje de Yelp — contéstalo directamente en la app de Yelp.",
      );
    }
    await markProcessed(lead.gmailMessageId);
    return { gmailMessageId: lead.gmailMessageId, status: "skipped_untrusted_address" };
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
    storeId: lead.storeId,
  });
  const replyText = aiReply || fallbackReply(store);

  try {
    await sendGmailEmail({
      to: lead.replyToAddress,
      fromEmail: YELP_REPLY_FROM_EMAIL,
      fromName: YELP_REPLY_FROM_NAME,
      subject: `Re: ${lead.subject}`,
      // Yelp rejects raw single-part MIME from this sender, but accepts the
      // multipart shape used by ordinary email clients. The HTML is a minimal
      // copy of the text—no logo, buttons, links or branded footer to flatten.
      html: renderYelpRelayHtml(replyText),
      text: replyText,
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

async function processRejectionNotice(rawEmail) {
  const rejection = parseYelpLeadEmail(rawEmail);
  const sourceMessageId = rejection.threadId
    ? await findYelpRelaySourceMessageId(rejection.threadId, rejection.gmailMessageId)
    : null;
  const record = sourceMessageId ? await findYelpLeadByGmailMessageId(sourceMessageId) : null;

  if (record) {
    await markYelpLeadDeliveryFailed(record.id);
    await notifyOwnerOfFailure(
      rejection,
      "Yelp rechazó la respuesta por un formato de correo no compatible. El cliente no recibió el mensaje; " +
        "contéstale directamente en Yelp for Business.",
    );
  }
  await markProcessed(rejection.gmailMessageId);
  return {
    gmailMessageId: rejection.gmailMessageId,
    sourceMessageId,
    status: record ? "delivery_rejected" : "rejection_unmatched",
  };
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

  const rejectionEmails = await listUnreadYelpRejectionEmails();
  const rejections = [];
  for (const email of rejectionEmails) {
    try {
      rejections.push(await processRejectionNotice(email));
    } catch (error) {
      console.error(`Could not reconcile Yelp rejection ${email.gmailMessageId}:`, error);
      rejections.push({ gmailMessageId: email.gmailMessageId, status: "error", error: error?.message });
    }
  }

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
  return { skipped: false, checked: emails.length, rejections, results };
}
