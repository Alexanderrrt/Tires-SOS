import test from "node:test";
import assert from "node:assert/strict";
import { trackConfirmedLead, initializeGoogleTag, GOOGLE_ADS_LEAD_DESTINATION } from "../lib/google-lead-tracking.js";

const complete = { leadCaptured: true, persisted: true, leadConversionId: "lead_1234567890abcdef" };
function browser(hostname = "tiressosrescue.com", storage = new Map()) {
  return { location: { hostname }, localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) } };
}
function conversions(b) { return (b.dataLayer || []).map((a) => [...a]).filter((a) => a[0] === "event"); }

test("page load, partial lead, failed persistence, and preview traffic never convert", () => {
  const b = browser();
  initializeGoogleTag(b);
  for (const status of [undefined, {}, { ...complete, leadCaptured: false }, { ...complete, persisted: false }, { ...complete, leadConversionId: null }, { ...complete, leadConversionId: "customer@example.com" }]) {
    assert.equal(trackConfirmedLead(status, b), false);
  }
  assert.deepEqual(conversions(b), []);
  assert.equal(trackConfirmedLead(complete, browser("localhost")), false);
  assert.equal(trackConfirmedLead(complete, browser("preview.vercel.app")), false);
});

test("one durable lead produces exactly one event with no personal details", () => {
  const b = browser();
  assert.equal(trackConfirmedLead({ ...complete, name: "Private", phone: "Private", transcript: "Private" }, b), true);
  assert.equal(trackConfirmedLead(complete, b), false);
  assert.deepEqual(conversions(b), [["event", "conversion", { send_to: GOOGLE_ADS_LEAD_DESTINATION, transaction_id: complete.leadConversionId }]]);
});

test("reloads deduplicate; a different completed lead can convert", () => {
  const storage = new Map();
  trackConfirmedLead(complete, browser(undefined, storage));
  const reloaded = browser(undefined, storage);
  assert.equal(trackConfirmedLead(complete, reloaded), false);
  assert.equal(trackConfirmedLead({ ...complete, leadConversionId: "lead_abcdef1234567890" }, reloaded), true);
});

test("blocked storage does not break chat or duplicate in memory", () => {
  const b = browser();
  b.localStorage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
  assert.equal(trackConfirmedLead(complete, b), true);
  assert.equal(trackConfirmedLead(complete, b), false);
});
