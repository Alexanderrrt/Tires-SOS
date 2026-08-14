import { escapeHtml } from "./email-template.js";

/**
 * Yelp's email relay expects the multipart shape produced by ordinary email
 * clients, but it also flattens the HTML part into the visible chat bubble.
 * Keep the HTML intentionally minimal and semantically identical to `text`.
 */
export function renderYelpRelayHtml(replyText) {
  const paragraphs = String(replyText || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => escapeHtml(line.trim()))
        .join("<br>"),
    )
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 12px;">${paragraph}</p>`)
    .join("");

  return [
    '<!doctype html><html><body style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.45;color:#111;">',
    paragraphs,
    "</body></html>",
  ].join("");
}
