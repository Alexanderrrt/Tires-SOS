const CRLF = "\r\n";

function cleanHeader(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

function encodeHeaderValue(value) {
  const safe = cleanHeader(value);
  if (/^[\x20-\x7e]*$/.test(safe)) return safe;
  return `=?UTF-8?B?${Buffer.from(safe, "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
  return String(value || "").match(/.{1,76}/g)?.join(CRLF) || "";
}

function encodeBody(value) {
  return wrapBase64(Buffer.from(String(value ?? ""), "utf8").toString("base64"));
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function htmlToPlainText(html) {
  const text = String(html || "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(?:p|div|h[1-6]|li|tr|td|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(text)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function boundary(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function alternativeParts({ html, text, alternativeBoundary }) {
  return [
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(text || htmlToPlainText(html)),
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(html),
    `--${alternativeBoundary}--`,
  ];
}

export function buildEmailMime({
  to,
  fromEmail,
  fromName,
  subject,
  html,
  text,
  replyTo,
  inReplyToMessageId,
  inlineImages = [],
}) {
  const alternativeBoundary = boundary("tires_sos_alt");
  const relatedBoundary = boundary("tires_sos_related");
  const safeFromEmail = cleanHeader(fromEmail);
  const safeFromName = cleanHeader(fromName);
  const fromHeader = safeFromName
    ? `${encodeHeaderValue(safeFromName)} <${safeFromEmail}>`
    : safeFromEmail;
  const headers = [
    `From: ${fromHeader}`,
    `To: ${cleanHeader(to)}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    ...(replyTo ? [`Reply-To: ${cleanHeader(replyTo)}`] : []),
    ...(inReplyToMessageId
      ? [
          `In-Reply-To: ${cleanHeader(inReplyToMessageId)}`,
          `References: ${cleanHeader(inReplyToMessageId)}`,
        ]
      : []),
    "MIME-Version: 1.0",
  ];

  // Some email-to-chat relays (including Yelp Messaging) flatten HTML into
  // visible chat text instead of honoring multipart/alternative semantics.
  // When a caller intentionally omits HTML, emit a genuine text-only message
  // so the relay receives exactly the customer-facing copy and nothing else.
  if (!html) {
    return [
      ...headers,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      encodeBody(text),
      "",
    ].join(CRLF);
  }

  if (!inlineImages.length) {
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      "",
      ...alternativeParts({ html, text, alternativeBoundary }),
      "",
    ].join(CRLF);
  }

  const parts = [
    ...headers,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    "",
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    ...alternativeParts({ html, text, alternativeBoundary }),
  ];

  for (const image of inlineImages) {
    const filename = cleanHeader(image.filename || "image.png").replace(/["\\]/g, "");
    const cid = cleanHeader(image.cid).replace(/[<>]/g, "");
    const content = Buffer.isBuffer(image.content)
      ? image.content.toString("base64")
      : String(image.content || "").replace(/\s+/g, "");
    parts.push(
      `--${relatedBoundary}`,
      `Content-Type: ${cleanHeader(image.contentType || "application/octet-stream")}; name="${filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: inline; filename="${filename}"`,
      `Content-ID: <${cid}>`,
      "",
      wrapBase64(content),
    );
  }

  parts.push(`--${relatedBoundary}--`, "");
  return parts.join(CRLF);
}
