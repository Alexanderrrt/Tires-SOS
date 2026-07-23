// Minimal Gmail REST API client (raw fetch, no googleapis dependency — matches
// this repo's existing no-SDK pattern for Groq). Reads unread Yelp "Request a
// Quote" lead emails, marks them processed, and sends the AI-drafted reply
// through this same Gmail account (not Resend) so it lands in the account's
// own Sent folder, threads correctly, and comes from infrastructure Yelp's
// message relay already trusts.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const REQUEST_TIMEOUT_MS = 10_000;
const YELP_LEAD_LABEL_NAME = "AI-Replied";
const YELP_MANUAL_LABEL_NAME = "Manual-Replied";

// Validated against real Yelp lead emails from Yelp <reply+...@messaging.yelp.com>.
// Yelp uses at least three distinct subject formats for genuine customer leads:
//   "Message from <Customer> for <Business Name>"        (new message / unreplied reminder)
//   "New Lead: Reply to <Customer>'s <service> request"  (Request a Quote lead)
//   "New Reply Message from <Customer>"                  (customer replied in an existing
//                                                          thread; sent from no-reply@yelp.com,
//                                                          not messaging.yelp.com, and has no
//                                                          message text inline — see
//                                                          lib/yelp-lead-parser.js)
// The first two are matched explicitly so account/marketing emails from the
// same sender (e.g. "Still looking for a tire technician?", "Welcome to
// Yelp", email confirmation prompts) are excluded. Also excludes Yelp's own
// automated "RE: Message from <Customer> for <Business Name>" bounce/
// rejection notices (e.g. "you cannot reply to your Yelp messages via email
// after 10 days") — those reuse the same subject substring and would
// otherwise be picked up as if they were a new customer message. Adjust here
// if Yelp changes their subject formats or introduces a fourth one.
const YELP_LEAD_QUERY =
  '((from:messaging.yelp.com (subject:"for Tires SOS Rescue" OR subject:"New Lead:")) OR ' +
  '(from:yelp.com subject:"New Reply Message from")) -subject:"RE:" is:unread';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
let cachedLabelId = null;
let cachedManualLabelId = null;

export function gmailConfigured() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim(),
  );
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 30_000) {
    return cachedAccessToken;
  }
  const params = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) {
    throw new Error(`Gmail token refresh failed: ${body?.error_description || response.status}`);
  }
  cachedAccessToken = body.access_token;
  cachedAccessTokenExpiresAt = Date.now() + (Number(body.expires_in) || 3600) * 1000;
  return cachedAccessToken;
}

async function gmailFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 3 : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const token = await getAccessToken();
    const response = await fetchWithTimeout(`${GMAIL_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const body = await response.json().catch(() => null);
    if (response.ok) return body;
    if (response.status === 429 && attempt < maxAttempts) {
      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfterSeconds)
        ? Math.max(1_000, retryAfterSeconds * 1_000)
        : attempt * 1_250;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    throw new Error(`Gmail API error (${response.status}): ${body?.error?.message || "unknown error"}`);
  }
  throw new Error("Gmail API request failed.");
}

async function ensureLabelId() {
  if (cachedLabelId) return cachedLabelId;
  const { labels } = await gmailFetch("/labels");
  const existing = (labels || []).find((label) => label.name === YELP_LEAD_LABEL_NAME);
  if (existing) {
    cachedLabelId = existing.id;
    return cachedLabelId;
  }
  const created = await gmailFetch("/labels", {
    method: "POST",
    body: JSON.stringify({
      name: YELP_LEAD_LABEL_NAME,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    }),
  });
  cachedLabelId = created.id;
  return cachedLabelId;
}

async function ensureManualLabelId() {
  if (cachedManualLabelId) return cachedManualLabelId;
  const { labels } = await gmailFetch("/labels");
  const existing = (labels || []).find((label) => label.name === YELP_MANUAL_LABEL_NAME);
  if (existing) {
    cachedManualLabelId = existing.id;
    return cachedManualLabelId;
  }
  const created = await gmailFetch("/labels", {
    method: "POST",
    body: JSON.stringify({
      name: YELP_MANUAL_LABEL_NAME,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    }),
  });
  cachedManualLabelId = created.id;
  return cachedManualLabelId;
}

function headerValue(headers, name) {
  return (headers || []).find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function decodeBase64Url(data) {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractBody(payload) {
  if (!payload) return { html: "", text: "" };
  let html = "";
  let text = "";

  function walk(part) {
    if (!part) return;
    const mimeType = part.mimeType || "";
    if (mimeType === "text/html" && part.body?.data && !html) {
      html = decodeBase64Url(part.body.data);
    } else if (mimeType === "text/plain" && part.body?.data && !text) {
      text = decodeBase64Url(part.body.data);
    }
    (part.parts || []).forEach(walk);
  }
  walk(payload);
  return { html, text };
}

function messageFromApi(message) {
  const headers = message.payload?.headers || [];
  const { html, text } = extractBody(message.payload);
  return {
    gmailMessageId: message.id,
    threadId: message.threadId,
    messageIdHeader: headerValue(headers, "Message-ID"),
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    to: headerValue(headers, "To"),
    replyTo: headerValue(headers, "Reply-To"),
    receivedAt: Number.isFinite(Number(message.internalDate))
      ? new Date(Number(message.internalDate)).toISOString()
      : null,
    labelIds: message.labelIds || [],
    html,
    text,
  };
}

function safeGmailId(value, label) {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`Invalid Gmail ${label}.`);
  return id;
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

/** Fetches one Gmail message without modifying it. */
export async function getGmailMessage(gmailMessageId) {
  const id = safeGmailId(gmailMessageId, "message ID");
  const message = await gmailFetch(`/messages/${id}?format=full`);
  return messageFromApi(message);
}

/**
 * Broad, read-only inbox inspection for the admin Yelp debug panel.
 * Unlike the automatic responder query, this deliberately includes read
 * messages and subject formats the automation does not currently recognize.
 */
export async function listRecentYelpEmails({ days = 7, maxResults = 30 } = {}) {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 30);
  const safeMax = Math.min(Math.max(Number(maxResults) || 30, 1), 50);
  const query = `newer_than:${safeDays}d (from:messaging.yelp.com OR from:yelp.com)`;
  const search = await gmailFetch(`/messages?q=${encodeURIComponent(query)}&maxResults=${safeMax}`);
  const messages = await mapWithConcurrency(
    search.messages || [],
    4,
    ({ id }) => getGmailMessage(id),
  );
  return messages.sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")));
}

/**
 * Read-only thread safety check used before a manual reply. Yelp permits one
 * email reply per conversation, so any message already in Sent blocks another.
 */
export async function getGmailThreadDiagnostics(threadId, sourceMessageId) {
  const id = safeGmailId(threadId, "thread ID");
  const sourceId = safeGmailId(sourceMessageId, "message ID");
  const thread = await gmailFetch(`/threads/${id}?format=metadata`);
  const sentMessages = (thread.messages || []).filter(
    (message) => message.id !== sourceId && (message.labelIds || []).includes("SENT"),
  );
  return {
    messageCount: (thread.messages || []).length,
    sentReplyCount: sentMessages.length,
    hasSentReply: sentMessages.length > 0,
  };
}

/**
 * Lists unread Yelp "Request a Quote" emails and returns them in a shape
 * ready for lib/yelp-lead-parser.js. Does not mark anything as read.
 *
 * @param {{ sinceMs?: number }} options - when provided, messages whose
 *   internalDate is at or before sinceMs are skipped entirely (not even
 *   returned), so an old backlog can never be reprocessed regardless of its
 *   read/unread state.
 */
export async function listUnreadYelpLeadEmails({ sinceMs } = {}) {
  const search = await gmailFetch(`/messages?q=${encodeURIComponent(YELP_LEAD_QUERY)}&maxResults=25`);
  const ids = (search.messages || []).map((message) => message.id);
  const emails = [];
  for (const id of ids) {
    const email = await getGmailMessage(id);
    const internalDateMs = email.receivedAt ? new Date(email.receivedAt).getTime() : NaN;
    if (sinceMs && Number.isFinite(internalDateMs) && internalDateMs <= sinceMs) continue;
    emails.push(email);
  }
  return emails;
}

/** Removes UNREAD and applies the "AI-Replied" label so it isn't reprocessed. */
export async function markProcessed(gmailMessageId) {
  const labelId = await ensureLabelId();
  await gmailFetch(`/messages/${gmailMessageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"], addLabelIds: [labelId] }),
  });
}

/** Marks an explicitly-admin-sent reply without mislabeling it as automatic. */
export async function markManualProcessed(gmailMessageId) {
  const labelId = await ensureManualLabelId();
  await gmailFetch(`/messages/${gmailMessageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"], addLabelIds: [labelId] }),
  });
}

function base64UrlEncode(input) {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// RFC 2047-encode header values that contain non-ASCII characters (e.g. an
// accented customer name echoed into the subject).
function encodeHeaderValue(value) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

/**
 * Sends an email through this Gmail account itself (Gmail API `messages.send`,
 * which the `gmail.modify` scope already covers — no extra OAuth consent
 * needed). This is the app's single email-sending transport (Resend was
 * retired); used for Yelp lead replies as well as every owner-facing
 * notification (chat/appointment leads, reports, alerts). Threads against
 * the original message when threadId/inReplyToMessageId are provided
 * (Yelp-reply use case); omit both for a plain, unthreaded email.
 */
export async function sendGmailEmail({ to, fromEmail, fromName, subject, html, replyTo, threadId, inReplyToMessageId }) {
  const fromHeader = fromName ? `${encodeHeaderValue(fromName)} <${fromEmail}>` : fromEmail;
  const lines = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    ...(inReplyToMessageId ? [`In-Reply-To: ${inReplyToMessageId}`, `References: ${inReplyToMessageId}`] : []),
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ];
  const raw = base64UrlEncode(lines.join("\r\n"));
  return gmailFetch("/messages/send", {
    method: "POST",
    body: JSON.stringify({ raw, ...(threadId ? { threadId } : {}) }),
  });
}
