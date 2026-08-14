import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { EMAIL_LOGO_CID } from "../lib/email-branding.js";
import { buildEmailMime } from "../lib/email-mime.js";
import { renderBrandedEmail } from "../lib/email-template.js";
import { detectStoreContact, getStoreContact } from "../lib/store-contact.js";
import { parseYelpLeadEmail } from "../lib/yelp-lead-parser.js";

function decodePart(mime, contentType) {
  const escaped = contentType.replace("/", "\\/");
  const match = mime.match(
    new RegExp(`Content-Type: ${escaped}[^\\r\\n]*\\r\\nContent-Transfer-Encoding: base64\\r\\n\\r\\n([A-Za-z0-9+/=\\r\\n]+?)\\r\\n--`),
  );
  assert.ok(match, `${contentType} MIME part should exist`);
  return Buffer.from(match[1].replace(/\s+/g, ""), "base64").toString("utf8");
}

test("branded Gmail MIME is multipart UTF-8 with an inline logo and text fallback", async () => {
  const store = getStoreContact("hayward");
  const html = renderBrandedEmail({
    title: "Solicitud de José",
    intro: "Necesita alineación y llantas.",
    content: "<p>Atención rápida.</p>",
    location: store,
  });
  const logo = await readFile(new URL("../public/favicon-96x96.png", import.meta.url));
  const mime = buildEmailMime({
    to: "customer@example.com",
    fromEmail: "tires@example.com",
    fromName: "Tires SOS Rescue",
    subject: "Respuesta para José",
    html,
    inlineImages: [{
      cid: EMAIL_LOGO_CID,
      filename: "tires-sos-logo.png",
      contentType: "image/png",
      content: logo,
    }],
  });

  assert.match(mime, /Content-Type: multipart\/related/);
  assert.match(mime, /Content-Type: multipart\/alternative/);
  assert.match(mime, /Content-ID: <tires-sos-logo@tiressosrescue\.com>/);
  assert.ok(mime.split("\r\n").every((line) => line.length < 998));

  const decodedHtml = decodePart(mime, "text/html");
  const decodedText = decodePart(mime, "text/plain");
  assert.match(decodedHtml, /Solicitud de José/);
  assert.match(decodedHtml, /cid:tires-sos-logo@tiressosrescue\.com/);
  assert.match(decodedHtml, /Tires SOS Rescue 3/);
  assert.match(decodedHtml, /\(669\) 877-4279/);
  assert.match(decodedHtml, /905 W A Street, Hayward, CA 94541/);
  assert.match(decodedText, /Solicitud de José/);
  assert.doesNotMatch(decodedText, /<[^>]+>/);
});

test("store detection maps Yelp listings and addresses to the correct contact", () => {
  assert.equal(detectStoreContact({ subject: "Message from Ana for Tires SOS Rescue 1" }).id, "taylor");
  assert.equal(detectStoreContact({ subject: "Message from Ana for Tires SOS Rescue 2" }).id, "tenth");
  assert.equal(detectStoreContact({ subject: "Message from Ana for Tires SOS Rescue 3" }).id, "hayward");
  assert.equal(detectStoreContact({ text: "Request sent to 1407 N 10th Street" }).storeNumber, 2);
  assert.equal(detectStoreContact({ text: "Request sent to 905 W A Street" }).storeNumber, 3);
});

test("Yelp parser carries the detected store into the reply workflow", () => {
  const lead = parseYelpLeadEmail({
    gmailMessageId: "gmail-1",
    threadId: "thread-1",
    messageIdHeader: "<message@example.com>",
    subject: "Message from Maria for Tires SOS Rescue 3",
    from: "Yelp <reply+abc@messaging.yelp.com>",
    to: "tires@example.com",
    replyTo: "",
    text: "I need two tires.\n\nYelp footer",
    html: "",
  });

  assert.equal(lead.storeId, "hayward");
  assert.equal(lead.storeNumber, 3);
  assert.equal(lead.businessName, "Tires SOS Rescue 3");
});
