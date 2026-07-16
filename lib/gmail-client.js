// Minimal Gmail REST API client (raw fetch, no googleapis dependency — matches
// this repo's existing no-SDK pattern for Groq). Used only to read unread
// Yelp "Request a Quote" lead emails and mark them processed; never sends
// mail from Gmail (replies go out through Resend, see lib/resend.js).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const REQUEST_TIMEOUT_MS = 10_000;
const YELP_LEAD_LABEL_NAME = "AI-Replied";

// Validated against real Yelp lead emails from Yelp <reply+...@messaging.yelp.com>.
// Yelp uses at least two distinct subject formats for genuine customer leads:
//   "Message from <Customer> for <Business Name>"        (new message / unreplied reminder)
//   "New Lead: Reply to <Customer>'s <service> request"  (Request a Quote lead)
// Both are matched explicitly so account/marketing emails from the same sender
// (e.g. "Still looking for a tire technician?", "Welcome to Yelp", email
// confirmation prompts) are excluded. Also excludes Yelp's own automated
// "RE: Message from <Customer> for <Business Name>" bounce/rejection notices
// (e.g. "you cannot reply to your Yelp messages via email after 10 days") —
// those reuse the same subject substring and would otherwise be picked up as
// if they were a new customer message. Adjust here if Yelp changes their
// subject formats or introduces a third one.
const YELP_LEAD_QUERY = 'from:messaging.yelp.com (subject:"for Tires SOS Rescue" OR subject:"New Lead:") -subject:"RE:" is:unread';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
let cachedLabelId = null;

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
  if (!response.ok) {
    throw new Error(`Gmail API error (${response.status}): ${body?.error?.message || "unknown error"}`);
  }
  return body;
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

/**
 * Lists unread Yelp "Request a Quote" emails and returns them in a shape
 * ready for lib/yelp-lead-parser.js. Does not mark anything as read.
 */
export async function listUnreadYelpLeadEmails() {
  const search = await gmailFetch(`/messages?q=${encodeURIComponent(YELP_LEAD_QUERY)}&maxResults=25`);
  const ids = (search.messages || []).map((message) => message.id);
  const emails = [];
  for (const id of ids) {
    const message = await gmailFetch(`/messages/${id}?format=full`);
    const headers = message.payload?.headers || [];
    const { html, text } = extractBody(message.payload);
    emails.push({
      gmailMessageId: message.id,
      subject: headerValue(headers, "Subject"),
      from: headerValue(headers, "From"),
      replyTo: headerValue(headers, "Reply-To"),
      html,
      text,
    });
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
