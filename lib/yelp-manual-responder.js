import {
  getGmailMessage,
  getGmailThreadDiagnostics,
  listRecentYelpEmails,
  markManualProcessed,
  sendGmailEmail,
} from "./gmail-client";
import { parseYelpLeadEmail } from "./yelp-lead-parser";
import { generateYelpLeadReply } from "./yelp-lead-ai-reply";
import {
  findYelpLeadByGmailMessageId,
  getResponderWatermark,
  insertPendingYelpLead,
  listRecentYelpLeads,
  markYelpLeadReplied,
} from "./yelp-leads-store";
import { diagnoseYelpMessage, isRelevantYelpDebugEmail } from "./yelp-manual-rules";
import { renderBrandedEmail, escapeHtml } from "./email-template";

const YELP_REPLY_FROM_EMAIL = process.env.YELP_REPLY_FROM_EMAIL || "";
const YELP_REPLY_FROM_NAME = process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue";
const MAX_REPLY_LENGTH = 5_000;
const THREAD_INSPECTION_CONCURRENCY = 3;

export class YelpManualReplyError extends Error {
  constructor(message, { code = "manual_reply_error", status = 400 } = {}) {
    super(message);
    this.name = "YelpManualReplyError";
    this.code = code;
    this.status = status;
  }
}

function cleanHeader(value, fallback = "") {
  return String(value || fallback).replace(/[\r\n]+/g, " ").trim();
}

function cleanReplyText(value) {
  const replyText = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!replyText) {
    throw new YelpManualReplyError("Write or generate a reply before sending.", {
      code: "reply_required",
    });
  }
  if (replyText.length > MAX_REPLY_LENGTH) {
    throw new YelpManualReplyError(`Reply must be ${MAX_REPLY_LENGTH.toLocaleString()} characters or less.`, {
      code: "reply_too_long",
    });
  }
  return replyText;
}

function buildManualReplyHtml(replyText) {
  const paragraphs = replyText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;color:#182230;font-size:15px;line-height:23px;">${escapeHtml(line)}</p>`,
    )
    .join("");
  return renderBrandedEmail({
    preheader: "Thanks for reaching out to Tires SOS Rescue",
    eyebrow: "Tires SOS Rescue",
    title: "We got your request!",
    content: paragraphs,
    primary: { href: "https://wa.me/14083328962", label: "WhatsApp us" },
    secondary: { href: "tel:+14083328962", label: "Call us" },
    footerNote: "Manual reply to your Yelp Request a Quote.",
  });
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, () => run()),
  );
  return results;
}

async function inspectRawMessage(rawEmail, { storedLead = null, watermarkMs = null, threadDiagnostics = null } = {}) {
  const lead = parseYelpLeadEmail(rawEmail);
  const thread =
    threadDiagnostics ||
    (lead.threadId
      ? await getGmailThreadDiagnostics(lead.threadId, lead.gmailMessageId)
      : { messageCount: 1, sentReplyCount: 0, hasSentReply: false });
  const unread = (rawEmail.labelIds || []).includes("UNREAD");
  const rules = diagnoseYelpMessage({
    fromAddress: lead.fromAddress,
    replyToAddress: lead.replyToAddress,
    subject: lead.subject,
    isFollowUpNotification: lead.isFollowUpNotification,
    unread,
    hasSentReply: thread.hasSentReply,
    storedStatus: storedLead?.status || null,
    receivedAt: rawEmail.receivedAt,
    watermarkMs,
  });

  return {
    gmailMessageId: lead.gmailMessageId,
    threadId: lead.threadId,
    subject: lead.subject,
    fromAddress: lead.fromAddress,
    replyToAddress: lead.replyToAddress,
    customerName: lead.customerName,
    customerMessage: lead.customerMessage,
    receivedAt: rawEmail.receivedAt,
    unread,
    processedLabel: (rawEmail.labelIds || []).includes("AI-Replied"),
    manualLabel: (rawEmail.labelIds || []).includes("Manual-Replied"),
    isFollowUpNotification: lead.isFollowUpNotification,
    storedLead: storedLead
      ? {
          id: storedLead.id,
          status: storedLead.status,
          aiReply: storedLead.aiReply,
          repliedAt: storedLead.repliedAt,
        }
      : null,
    thread,
    ...rules,
  };
}

export async function listYelpDebugMessages({ days = 7, maxResults = 30 } = {}) {
  const [emails, storedLeads, watermarkMs] = await Promise.all([
    listRecentYelpEmails({ days, maxResults }),
    listRecentYelpLeads(200),
    getResponderWatermark(),
  ]);
  const storedByMessageId = new Map(storedLeads.map((lead) => [lead.gmailMessageId, lead]));
  // Gmail's from:yelp.com search also returns newsletters from subdomains such
  // as mail.yelp.com. The owner panel should contain conversations, not Yelp
  // marketing templates. Keep all relay messages (including new subject
  // formats we want to diagnose), exact no-reply@yelp.com follow-ups, and any
  // message already recorded as a lead.
  const relevantEmails = emails.filter((email) => {
    const parsed = parseYelpLeadEmail(email);
    return isRelevantYelpDebugEmail({
      fromAddress: parsed.fromAddress,
      isFollowUpNotification: parsed.isFollowUpNotification,
      hasStoredLead: storedByMessageId.has(email.gmailMessageId),
    });
  });
  const threadIds = [...new Set(relevantEmails.map((email) => email.threadId).filter(Boolean))];
  const threadEntries = await mapWithConcurrency(
    threadIds,
    THREAD_INSPECTION_CONCURRENCY,
    async (threadId) => {
      const source = relevantEmails.find((email) => email.threadId === threadId);
      try {
        return [threadId, await getGmailThreadDiagnostics(threadId, source.gmailMessageId)];
      } catch (error) {
        return [
          threadId,
          {
            messageCount: null,
            sentReplyCount: null,
            hasSentReply: false,
            inspectionError: error?.message || "Thread inspection failed.",
          },
        ];
      }
    },
  );
  const threadById = new Map(threadEntries);
  const messages = await Promise.all(
    relevantEmails.map((email) =>
      inspectRawMessage(email, {
        storedLead: storedByMessageId.get(email.gmailMessageId) || null,
        watermarkMs,
        threadDiagnostics: threadById.get(email.threadId),
      }),
    ),
  );

  return {
    checkedAt: new Date().toISOString(),
    watermarkAt: Number.isFinite(watermarkMs) ? new Date(watermarkMs).toISOString() : null,
    days: Math.min(Math.max(Number(days) || 7, 1), 30),
    ignoredNoiseCount: emails.length - relevantEmails.length,
    messages,
    summary: {
      total: messages.length,
      needsAttention: messages.filter((message) => message.needsAttention).length,
      readyToReply: messages.filter((message) => message.canSend).length,
      alreadyReplied: messages.filter((message) => message.alreadyReplied).length,
      blocked: messages.filter((message) => !message.canSend && !message.alreadyReplied).length,
      unread: messages.filter((message) => message.unread).length,
    },
  };
}

async function getSafeManualMessage(gmailMessageId) {
  const rawEmail = await getGmailMessage(gmailMessageId);
  const existing = await findYelpLeadByGmailMessageId(rawEmail.gmailMessageId);
  const storedLead = existing ? { ...existing, aiReply: null, repliedAt: null } : null;
  const inspected = await inspectRawMessage(rawEmail, { storedLead });
  if (!inspected.canSend) {
    throw new YelpManualReplyError(inspected.diagnosis.label, {
      code: inspected.diagnosis.code,
      status: 409,
    });
  }
  return { rawEmail, inspected, existing };
}

export async function draftManualYelpReply(gmailMessageId) {
  const { inspected } = await getSafeManualMessage(gmailMessageId);
  if (!inspected.customerMessage) {
    throw new YelpManualReplyError("This email has no customer message that AI can draft from.", {
      code: "message_body_missing",
      status: 422,
    });
  }
  const draft = await generateYelpLeadReply({
    customerMessage: inspected.customerMessage,
    customerName: inspected.customerName,
  });
  if (!draft) {
    throw new YelpManualReplyError("AI could not generate a draft. You can still write the reply manually.", {
      code: "ai_draft_unavailable",
      status: 503,
    });
  }
  return {
    gmailMessageId: inspected.gmailMessageId,
    draft: cleanReplyText(draft),
    generatedAt: new Date().toISOString(),
  };
}

export async function sendManualYelpReply({ gmailMessageId, replyText }) {
  const safeReplyText = cleanReplyText(replyText);
  const { rawEmail, inspected, existing } = await getSafeManualMessage(gmailMessageId);
  const result = await sendGmailEmail({
    to: inspected.replyToAddress,
    fromEmail: YELP_REPLY_FROM_EMAIL,
    fromName: YELP_REPLY_FROM_NAME,
    subject: `Re: ${cleanHeader(inspected.subject, "Message from a customer")}`,
    html: buildManualReplyHtml(safeReplyText),
    threadId: inspected.threadId,
    inReplyToMessageId: cleanHeader(rawEmail.messageIdHeader),
  });

  const warnings = [];
  try {
    let record = existing;
    if (!record) {
      record = await insertPendingYelpLead({
        gmailMessageId: inspected.gmailMessageId,
        senderEmail: inspected.replyToAddress,
        customerName: inspected.customerName,
        customerMessage: inspected.customerMessage || "(Manual Yelp reply; message body unavailable)",
      });
    }
    await markYelpLeadReplied(record.id, safeReplyText);
  } catch (error) {
    warnings.push(`Reply sent, but lead history could not be updated: ${error?.message || "unknown error"}`);
  }
  try {
    await markManualProcessed(inspected.gmailMessageId);
  } catch (error) {
    warnings.push(`Reply sent, but the Gmail message could not be labeled: ${error?.message || "unknown error"}`);
  }

  return {
    sent: true,
    gmailMessageId: inspected.gmailMessageId,
    providerMessageId: result?.id || null,
    sentAt: new Date().toISOString(),
    warnings,
  };
}
