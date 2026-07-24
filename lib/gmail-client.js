// Minimal Gmail REST API client (raw fetch, no googleapis dependency — matches
// this repo's existing no-SDK pattern for Groq). Reads unread Yelp "Request a
// Quote" lead emails, marks them processed, and sends the AI-drafted reply
// through this same Gmail account (not Resend) so it lands in the account's
// own Sent folder, threads correctly, and comes from infrastructure Yelp's
// message relay already trusts.
import { getGmailCooldownUntil, setGmailCooldownUntil } from "./yelp-leads-store";

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
let gmailCooldownUntil = 0;
let gmailCooldownCheckedAt = 0;
let activeGmailReads = 0;
const pendingGmailReads = [];
const MAX_GMAIL_READ_CONCURRENCY = 2;
const MAX_SAFE_ATTEMPTS = 5;

export class GmailApiError extends Error {
  constructor(message, { status, reason, retryAfterMs = 0 } = {}) {
    super(message);
    this.name = "GmailApiError";
    this.status = status;
    this.reason = reason || null;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withReadPermit(worker) {
  if (activeGmailReads >= MAX_GMAIL_READ_CONCURRENCY) {
    await new Promise((resolve) => pendingGmailReads.push(resolve));
  }
  activeGmailReads += 1;
  try {
    return await worker();
  } finally {
    activeGmailReads -= 1;
    pendingGmailReads.shift()?.();
  }
}

function gmailErrorReason(body) {
  return body?.error?.errors?.[0]?.reason || body?.error?.status || null;
}

function parseRetryAfterMs(response, body) {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(1_000, seconds * 1_000);
    const dateMs = Date.parse(value);
    if (Number.isFinite(dateMs)) return Math.max(1_000, dateMs - Date.now());
  }
  const message = String(body?.error?.message || "");
  const timestamp = message.match(/retry after\s+(\d{4}-\d{2}-\d{2}T[0-9:.+-]+Z?)/i)?.[1];
  const timestampMs = timestamp ? Date.parse(timestamp) : NaN;
  return Number.isFinite(timestampMs) ? Math.max(1_000, timestampMs - Date.now()) : 0;
}

async function refreshSharedCooldown() {
  if (Date.now() - gmailCooldownCheckedAt < 10_000) return;
  gmailCooldownCheckedAt = Date.now();
  try {
    gmailCooldownUntil = Math.max(gmailCooldownUntil, await getGmailCooldownUntil());
  } catch (error) {
    console.warn("Could not read shared Gmail cooldown:", error?.message || "unknown error");
  }
}

async function persistSharedCooldown(untilMs) {
  gmailCooldownUntil = Math.max(gmailCooldownUntil, untilMs);
  gmailCooldownCheckedAt = Date.now();
  try {
    await setGmailCooldownUntil(gmailCooldownUntil);
  } catch (error) {
    console.warn("Could not persist shared Gmail cooldown:", error?.message || "unknown error");
  }
}

function endpointCategory(path) {
  if (path.includes("/messages/send")) return "messages.send";
  if (path.includes("/modify")) return "messages.modify";
  if (path.includes("/threads/")) return "threads.get";
  if (/\/messages\/[^?]+/.test(path)) return "messages.get";
  if (path.startsWith("/messages")) return "messages.list";
  if (path.startsWith("/labels")) return "labels";
  return "other";
}

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
  const idempotent = method === "GET" || options.idempotent === true;
  const { idempotent: _idempotent, ...fetchOptions } = options;
  const maxAttempts = idempotent ? MAX_SAFE_ATTEMPTS : 1;
  const category = endpointCategory(path);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (idempotent) {
      await refreshSharedCooldown();
      if (Date.now() < gmailCooldownUntil) {
        throw new GmailApiError("Gmail is temporarily rate limited.", {
          status: 429,
          reason: "rateLimitExceeded",
          retryAfterMs: gmailCooldownUntil - Date.now(),
        });
      }
    }
    const token = await getAccessToken();
    const startedAt = Date.now();
    const request = () => fetchWithTimeout(`${GMAIL_API_BASE}${path}`, {
      ...fetchOptions,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const response = method === "GET" ? await withReadPermit(request) : await request();
    const body = await response.json().catch(() => null);
    const reason = gmailErrorReason(body);
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 && ["rateLimitExceeded", "userRateLimitExceeded"].includes(reason));
    console.info("Gmail API request", {
      category,
      status: response.status,
      attempt,
      durationMs: Date.now() - startedAt,
      rateLimited,
    });
    if (response.ok) return body;
    if ((rateLimited || response.status >= 500) && attempt < maxAttempts) {
      const headerDelay = parseRetryAfterMs(response, body);
      const exponentialDelay = Math.min(32_000, 1_000 * (2 ** (attempt - 1)));
      const delayMs = headerDelay || exponentialDelay + Math.floor(Math.random() * 1_001);
      if (rateLimited) {
        await persistSharedCooldown(Date.now() + delayMs);
        // A long provider-directed lockout must not hold a server request open
        // or retry early; all workers will skip Gmail until this timestamp.
        if (delayMs > 32_000) {
          throw new GmailApiError(
            `Gmail API error (${response.status}): ${body?.error?.message || "rate limited"}`,
            { status: response.status, reason, retryAfterMs: delayMs },
          );
        }
      }
      await sleep(delayMs);
      continue;
    }
    const finalRetryAfterMs = rateLimited
      ? Math.max(parseRetryAfterMs(response, body), gmailCooldownUntil - Date.now(), 1_000)
      : 0;
    throw new GmailApiError(
      `Gmail API error (${response.status}): ${body?.error?.message || "unknown error"}`,
      { status: response.status, reason, retryAfterMs: finalRetryAfterMs },
    );
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
    2,
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
    idempotent: true,
    body: JSON.stringify({ removeLabelIds: ["UNREAD"], addLabelIds: [labelId] }),
  });
}

/** Marks an explicitly-admin-sent reply without mislabeling it as automatic. */
export async function markManualProcessed(gmailMessageId) {
  const labelId = await ensureManualLabelId();
  await gmailFetch(`/messages/${gmailMessageId}/modify`, {
    method: "POST",
    idempotent: true,
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
