// Parses a raw Yelp "Request a Quote" lead email (as returned by
// lib/gmail-client.js) into a clean customer message plus the address we
// should actually reply to.
//
// NOTE: built without a real sample Yelp lead email in hand. The HTML-to-text
// cleanup and reply-address extraction are intentionally conservative/generic
// so they degrade safely, but should be double-checked against a real Yelp
// "Request a Quote" email the first time this runs and adjusted if the name
// pattern below doesn't match Yelp's actual wording.

const EMAIL_ADDRESS = /[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+/;

// Yelp's "New Reply Message from <Customer>" notification (sent when a
// customer replies within an existing thread) comes from no-reply@yelp.com,
// not the per-thread reply+<id>@messaging.yelp.com relay. It is a dead-end
// address — emailing it does not reach the customer — so it must never be
// used as a reply-to address even though it's technically a well-formed
// address in the From header.
const NON_ROUTABLE_YELP_ADDRESSES = new Set(["no-reply@yelp.com"]);

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function htmlToText(html) {
  if (!html) return "";
  const withBreaks = html
    .replace(/<(br|\/p|\/div|\/tr|\/li)\s*\/?>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(stripped)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Extracts an email address from a "Display Name <email@domain.com>" header value. */
function addressFromHeader(headerValue) {
  if (!headerValue) return "";
  const angleMatch = headerValue.match(/<([^>]+)>/);
  const candidate = angleMatch ? angleMatch[1] : headerValue;
  return EMAIL_ADDRESS.test(candidate) ? candidate.match(EMAIL_ADDRESS)[0] : "";
}

// Yelp's From header display name is always the literal "Yelp" (the relay
// address is reply+<id>@messaging.yelp.com, not the customer), so the
// customer's name has to come from the subject line instead. Yelp uses (at
// least) two subject formats, each with the name in a different spot:
//   "Message from <Customer> for <Business Name>"
//   "New Lead: Reply to <Customer>'s <service> request"
function customerNameFromSubject(subject) {
  const messageMatch = subject?.match(/^Message from (.+?) for /i);
  if (messageMatch) return messageMatch[1].trim();
  const newLeadMatch = subject?.match(/^New Lead: Reply to (.+?)'s /i);
  if (newLeadMatch) return newLeadMatch[1].trim();
  const replyNotificationMatch = subject?.match(/^New Reply Message from (.+?)\.?\s*$/i);
  if (replyNotificationMatch) return replyNotificationMatch[1].trim();
  return "";
}

/** True for Yelp's bodyless "New Reply Message from <Customer>" thread notification. */
function isFollowUpNotification(subject) {
  return /^New Reply Message from /i.test(subject || "");
}

// Fallback when the subject doesn't match either known format: the lead
// body itself usually opens with "<Customer> requested a quote from...".
function customerNameFromMessage(bodyText) {
  const match = bodyText?.match(/^(.+?) requested a quote/i);
  return match ? match[1].trim() : "";
}

// Yelp's plain-text body puts the customer's actual answer text as one
// unbroken paragraph at the very top, before a blank line, followed by
// invisible zero-width padding characters and template chrome (footer
// links, "I've Already Replied" buttons, unsubscribe text, etc). Taking
// everything up to the first blank line reliably isolates just the
// customer's message. Verified against a real Yelp lead email.
function extractCustomerMessage(bodyText) {
  const firstParagraph = bodyText.trim().split(/\r?\n[ \t]*\r?\n/)[0] || "";
  return firstParagraph
    .replace(/[\u00ad\u034f\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {{ gmailMessageId: string, subject: string, from: string, replyTo: string, html: string, text: string }} email
 */
export function parseYelpLeadEmail(email) {
  const bodyText = email.text?.trim() || htmlToText(email.html);

  // Yelp has no masked customer address; there's no Reply-To header at all —
  // replying to the From address (reply+<id>@messaging.yelp.com) is how
  // Yelp routes the message back to the customer. Never reply to
  // no-reply@yelp.com or any other Yelp system address.
  let replyToAddress = addressFromHeader(email.replyTo) || addressFromHeader(email.from);
  if (NON_ROUTABLE_YELP_ADDRESSES.has(replyToAddress.toLowerCase())) {
    replyToAddress = "";
  }
  const customerMessage = extractCustomerMessage(bodyText).slice(0, 20_000);
  const customerName = customerNameFromSubject(email.subject) || customerNameFromMessage(customerMessage) || "";

  return {
    gmailMessageId: email.gmailMessageId,
    threadId: email.threadId,
    messageIdHeader: email.messageIdHeader,
    subject: email.subject || "Message from a customer",
    // The real From address (not the display name) so callers can verify the
    // sender's domain — Gmail's from: search operator can match a spoofed
    // display name, so the domain must be re-checked before acting.
    fromAddress: addressFromHeader(email.from),
    replyToAddress,
    customerName,
    customerMessage,
    isFollowUpNotification: isFollowUpNotification(email.subject),
  };
}
